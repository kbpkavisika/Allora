-- Voice messages. Buyers and sellers can send a recorded clip instead of, or alongside, text. The
-- audio lives on Cloudinary like product photos, and the message row keeps its url and length.
-- A voice message may have an empty body; every other message still needs text.

alter table public.messages
  add column audio_url text,
  add column audio_duration_ms integer check (audio_duration_ms between 1 and 120000),
  add constraint messages_audio_complete check ((audio_url is null) = (audio_duration_ms is null));

alter table public.messages drop constraint messages_body_check;

alter table public.messages add constraint messages_body_check check (
  char_length(btrim(body)) <= 2000
  and (char_length(btrim(body)) >= 1 or audio_url is not null)
);

drop function public.send_message(text, uuid, uuid, uuid, uuid, uuid);

create function public.send_message(
  p_body text,
  p_conversation_id uuid default null,
  p_shop_id uuid default null,
  p_product_id uuid default null,
  p_order_id uuid default null,
  p_buyer_id uuid default null,
  p_audio_url text default null,
  p_audio_duration_ms integer default null
)
returns public.messages
language plpgsql
security definer set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_body text := btrim(coalesce(p_body, ''));
  v_audio_url text := nullif(btrim(coalesce(p_audio_url, '')), '');
  v_conversation_id uuid;
  v_owner_id uuid;
  v_buyer_id uuid;
  v_message public.messages;
begin
  if v_user is null then
    raise exception 'Not signed in.' using errcode = '42501';
  end if;

  if v_audio_url is null then
    if char_length(v_body) not between 1 and 2000 then
      raise exception 'Messages must be between 1 and 2000 characters.' using errcode = '22023';
    end if;
  else
    if v_audio_url !~ '^https://res\.cloudinary\.com/[^/]+/video/upload/' then
      raise exception 'Voice messages must be uploaded first.' using errcode = '22023';
    end if;

    if p_audio_duration_ms is null or p_audio_duration_ms not between 1 and 120000 then
      raise exception 'Voice messages can be up to 2 minutes long.' using errcode = '22023';
    end if;

    if char_length(v_body) > 2000 then
      raise exception 'Messages must be between 1 and 2000 characters.' using errcode = '22023';
    end if;
  end if;

  if p_conversation_id is not null then
    if not public.is_conversation_participant(p_conversation_id) then
      raise exception 'Conversation not found.' using errcode = '42501';
    end if;
    v_conversation_id := p_conversation_id;
  elsif p_shop_id is not null then
    select owner_id into v_owner_id from public.shops where id = p_shop_id;

    if v_owner_id is null then
      raise exception 'Shop not found.' using errcode = 'P0002';
    end if;

    if v_owner_id = v_user then
      if p_buyer_id is null then
        raise exception 'You cannot message your own shop.' using errcode = '22023';
      end if;

      if not public.can_seller_contact_buyer(p_shop_id, p_buyer_id) then
        raise exception 'You can only message buyers who ordered from your shop.' using errcode = '42501';
      end if;

      v_buyer_id := p_buyer_id;
    elsif p_buyer_id is not null and p_buyer_id <> v_user then
      raise exception 'Only the shop owner can message a buyer.' using errcode = '42501';
    else
      v_buyer_id := v_user;
    end if;

    insert into public.conversations (buyer_id, shop_id)
    values (v_buyer_id, p_shop_id)
    on conflict (buyer_id, shop_id) do nothing
    returning id into v_conversation_id;

    if v_conversation_id is null then
      select id into v_conversation_id
      from public.conversations
      where buyer_id = v_buyer_id and shop_id = p_shop_id;
    end if;

    insert into public.conversation_participants (conversation_id, user_id)
    values (v_conversation_id, v_buyer_id), (v_conversation_id, v_owner_id)
    on conflict (conversation_id, user_id) do nothing;
  else
    raise exception 'A conversation or shop is required.' using errcode = '22023';
  end if;

  if p_product_id is not null and not exists (
    select 1
    from public.products p
    join public.conversations c on c.shop_id = p.shop_id
    where p.id = p_product_id and c.id = v_conversation_id
  ) then
    raise exception 'That product is not sold by this shop.' using errcode = '22023';
  end if;

  if p_order_id is not null and not exists (
    select 1
    from public.orders o
    join public.conversations c on c.shop_id = o.shop_id and c.buyer_id = o.buyer_id
    where o.id = p_order_id and c.id = v_conversation_id
  ) then
    raise exception 'That order does not belong to this conversation.' using errcode = '22023';
  end if;

  insert into public.messages (
    conversation_id, sender_id, body, product_id, order_id, audio_url, audio_duration_ms
  )
  values (
    v_conversation_id, v_user, v_body, p_product_id, p_order_id, v_audio_url,
    case when v_audio_url is null then null else p_audio_duration_ms end
  )
  returning * into v_message;

  update public.conversations
  set last_message_at = v_message.created_at
  where id = v_conversation_id;

  update public.conversation_participants
  set last_read_at = v_message.created_at
  where conversation_id = v_conversation_id and user_id = v_user;

  return v_message;
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
  counterpart_last_read_at timestamptz,
  last_message_is_voice boolean
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
    ),
    coalesce(last_message.audio_url is not null, false)
  from public.conversation_participants p
  join public.conversations c on c.id = p.conversation_id
  join public.shops s on s.id = c.shop_id
  join public.profiles b on b.id = c.buyer_id
  left join lateral (
    select m.body, m.sender_id, m.audio_url
    from public.messages m
    where m.conversation_id = c.id
    order by m.created_at desc
    limit 1
  ) last_message on true
  where p.user_id = auth.uid()
  order by c.last_message_at desc nulls last;
$$;

create or replace function public.push_new_message()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
declare
  v_sender_name text;
  v_notifications jsonb;
  v_is_voice_only boolean := new.audio_url is not null and btrim(new.body) = '';
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
      'body', case
        when v_is_voice_only then case t.language
          when 'si' then 'හඬ පණිවිඩය'
          when 'ta' then 'குரல் செய்தி'
          else 'Voice message'
        end
        else left(new.body, 180)
      end,
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

revoke all on function public.send_message(text, uuid, uuid, uuid, uuid, uuid, text, integer) from public, anon;
revoke all on function public.list_conversations() from public, anon;

grant execute on function public.send_message(text, uuid, uuid, uuid, uuid, uuid, text, integer) to authenticated;
grant execute on function public.list_conversations() to authenticated;
