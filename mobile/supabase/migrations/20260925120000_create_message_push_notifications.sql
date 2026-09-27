-- Push notifications for new chat messages, delivered through the Expo push service. Devices
-- register their Expo push token; an insert on messages posts one notification per recipient
-- device via pg_net, skipping recipients who turned message notifications off or muted the thread.

create extension if not exists pg_net with schema extensions;

alter table public.profiles
  add column message_notifications boolean not null default true;

alter table public.conversation_participants
  add column muted boolean not null default false;

create table public.push_tokens (
  token text primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  platform text not null check (platform in ('ios', 'android')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index push_tokens_user_id_idx on public.push_tokens (user_id);

alter table public.push_tokens disable row level security;

revoke all on table public.push_tokens from anon, authenticated;

-- A device's token moves to whoever signed in on it last, so a shared phone never keeps
-- notifying the previous account.
create function public.register_push_token(p_token text, p_platform text)
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

  insert into public.push_tokens (token, user_id, platform)
  values (p_token, auth.uid(), p_platform)
  on conflict (token) do update
  set user_id = excluded.user_id, platform = excluded.platform, updated_at = now();
end;
$$;

create function public.unregister_push_token(p_token text)
returns void
language sql
security definer set search_path = ''
as $$
  delete from public.push_tokens where token = p_token and user_id = auth.uid();
$$;

create function public.set_conversation_muted(p_conversation_id uuid, p_muted boolean)
returns void
language plpgsql
security definer set search_path = ''
as $$
begin
  update public.conversation_participants
  set muted = p_muted
  where conversation_id = p_conversation_id and user_id = auth.uid();

  if not found then
    raise exception 'Conversation not found.' using errcode = '42501';
  end if;
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
  muted boolean
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
      else coalesce(nullif(btrim(b.full_name), ''), 'Buyer')
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
    p.muted
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

create function public.push_new_message()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
declare
  v_title text;
  v_notifications jsonb;
begin
  select
    case
      when new.sender_id = c.buyer_id then coalesce(nullif(btrim(b.full_name), ''), 'Buyer')
      else s.name
    end
  into v_title
  from public.conversations c
  join public.shops s on s.id = c.shop_id
  join public.profiles b on b.id = c.buyer_id
  where c.id = new.conversation_id;

  select jsonb_agg(
    jsonb_build_object(
      'to', t.token,
      'title', v_title,
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

create trigger messages_push_new_message
  after insert on public.messages
  for each row execute function public.push_new_message();

revoke all on function public.push_new_message() from public, anon, authenticated;

revoke all on function public.register_push_token(text, text) from public, anon;
revoke all on function public.unregister_push_token(text) from public, anon;
revoke all on function public.set_conversation_muted(uuid, boolean) from public, anon;
revoke all on function public.list_conversations() from public, anon;

grant execute on function public.register_push_token(text, text) to authenticated;
grant execute on function public.unregister_push_token(text) to authenticated;
grant execute on function public.set_conversation_muted(uuid, boolean) to authenticated;
grant execute on function public.list_conversations() to authenticated;
