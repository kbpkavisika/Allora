-- Chat follow-ups: read receipts, private inbox broadcasts and localised fallback names.
--
-- Read receipts: list_conversations returns when the other participant last read the thread, and
-- mark_conversation_read now tells both participants, so the sender's "Seen" updates live.
--
-- Private inbox: broadcasts used to go out on public topics, so anyone who knew a user id could
-- watch when they received messages. They are now private, and only the inbox owner may receive
-- them. Supabase decides who can join a private channel through policies on its own
-- realtime.messages table, which ships with row level security already on; no project table
-- changes here.
--
-- Fallback names: an unnamed buyer is returned as null so the app shows the word in the reader's
-- language. Push titles are rendered on the server, so each device registers its language with
-- its push token and gets the fallback in that language.

alter table public.push_tokens
  add column language text not null default 'en' check (language in ('en', 'si', 'ta'));

drop function public.register_push_token(text, text);

create function public.register_push_token(
  p_token text,
  p_platform text,
  p_language text default 'en'
)
returns void
language plpgsql
security definer set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'Not signed in.' using errcode = '42501';
  end if;

  if p_token !~ '^Expo(nent)?PushToken\[.+\]$' then
    raise exception 'Invalid push token.' using errcode = '22023';
  end if;

  insert into public.push_tokens (token, user_id, platform, language)
  values (p_token, auth.uid(), p_platform, coalesce(p_language, 'en'))
  on conflict (token) do update
  set user_id = excluded.user_id,
      platform = excluded.platform,
      language = excluded.language,
      updated_at = now();
end;
$$;

drop function public.list_conversations();

create function public.list_conversations()
returns table (
  id uuid,
  buyer_id uuid,
  shop_id uuid,
  counterpart_name text,
  last_message_body text,
  last_message_sender_id uuid,
  last_message_at timestamptz,
  unread_count integer,
  muted boolean,
  counterpart_last_read_at timestamptz
)
language sql
stable
security definer set search_path = ''
as $$
  select
    c.id,
    c.buyer_id,
    c.shop_id,
    case
      when c.buyer_id = auth.uid() then s.name
      else nullif(btrim(b.full_name), '')
    end,
    last_message.body,
    last_message.sender_id,
    c.last_message_at,
    (
      select count(*)::integer
      from public.messages m
      where m.conversation_id = c.id
        and m.sender_id <> auth.uid()
        and m.created_at > coalesce(p.last_read_at, '-infinity')
    ),
    p.muted,
    (
      select other.last_read_at
      from public.conversation_participants other
      where other.conversation_id = c.id and other.user_id <> auth.uid()
    )
  from public.conversation_participants p
  join public.conversations c on c.id = p.conversation_id
  join public.shops s on s.id = c.shop_id
  join public.profiles b on b.id = c.buyer_id
  left join lateral (
    select m.body, m.sender_id
    from public.messages m
    where m.conversation_id = c.id
    order by m.created_at desc
    limit 1
  ) last_message on true
  where p.user_id = auth.uid()
  order by c.last_message_at desc nulls last;
$$;

create or replace function public.mark_conversation_read(p_conversation_id uuid)
returns void
language plpgsql
security definer set search_path = ''
as $$
declare
  v_participant uuid;
begin
  update public.conversation_participants
  set last_read_at = now()
  where conversation_id = p_conversation_id and user_id = auth.uid();

  if not found then
    raise exception 'Conversation not found.' using errcode = '42501';
  end if;

  for v_participant in
    select user_id
    from public.conversation_participants
    where conversation_id = p_conversation_id
  loop
    perform realtime.send(
      jsonb_build_object('conversation_id', p_conversation_id),
      'read',
      'inbox:' || v_participant::text,
      true
    );
  end loop;
end;
$$;

create or replace function public.broadcast_new_message()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
declare
  v_participant uuid;
begin
  for v_participant in
    select user_id
    from public.conversation_participants
    where conversation_id = new.conversation_id
  loop
    perform realtime.send(
      jsonb_build_object('conversation_id', new.conversation_id, 'message_id', new.id),
      'message',
      'inbox:' || v_participant::text,
      true
    );
  end loop;

  return new;
end;
$$;

create or replace function public.push_new_message()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
declare
  v_sender_name text;
  v_notifications jsonb;
begin
  select
    case
      when new.sender_id = c.buyer_id then nullif(btrim(b.full_name), '')
      else s.name
    end
  into v_sender_name
  from public.conversations c
  join public.shops s on s.id = c.shop_id
  join public.profiles b on b.id = c.buyer_id
  where c.id = new.conversation_id;

  select jsonb_agg(
    jsonb_build_object(
      'to', t.token,
      'title', coalesce(
        v_sender_name,
        case t.language
          when 'si' then 'ගැනුම්කරු'
          when 'ta' then 'வாடிக்கையாளர்'
          else 'Buyer'
        end
      ),
      'body', left(new.body, 180),
      'sound', 'default',
      'channelId', 'messages',
      'data', jsonb_build_object('conversation_id', new.conversation_id)
    )
  )
  into v_notifications
  from public.conversation_participants p
  join public.profiles r on r.id = p.user_id
  join public.push_tokens t on t.user_id = p.user_id
  where p.conversation_id = new.conversation_id
    and p.user_id <> new.sender_id
    and not p.muted
    and r.message_notifications;

  if v_notifications is not null then
    perform net.http_post(
      url := 'https://exp.host/--/api/v2/push/send',
      body := v_notifications,
      headers := jsonb_build_object('Content-Type', 'application/json', 'Accept', 'application/json')
    );
  end if;

  return new;
end;
$$;

create policy "Users receive their own inbox broadcasts"
on realtime.messages
for select
to authenticated
using (
  realtime.messages.extension = 'broadcast'
  and (select realtime.topic()) = 'inbox:' || (select auth.uid())::text
);

revoke all on function public.register_push_token(text, text, text) from public, anon;
revoke all on function public.list_conversations() from public, anon;

grant execute on function public.register_push_token(text, text, text) to authenticated;
grant execute on function public.list_conversations() to authenticated;
