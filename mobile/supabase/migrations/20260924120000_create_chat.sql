-- Buyer-seller chat. One conversation per buyer and shop; the shop owner and the buyer are its
-- two participants. RLS stays off (project rule), so the tables are closed to the client roles
-- and every read and write goes through the security definer functions below, which check that
-- auth.uid() is a participant.

create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid not null references public.profiles (id) on delete cascade,
  shop_id uuid not null references public.shops (id) on delete cascade,
  last_message_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint conversations_one_per_buyer_and_shop unique (buyer_id, shop_id)
);

create index conversations_shop_id_idx on public.conversations (shop_id);

create trigger conversations_touch_updated_at
  before update on public.conversations
  for each row execute function public.touch_updated_at();

create table public.conversation_participants (
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  -- Null until the participant first reads the thread, so every message counts as unread.
  last_read_at timestamptz,
  created_at timestamptz not null default now(),
  primary key (conversation_id, user_id)
);

create index conversation_participants_user_id_idx on public.conversation_participants (user_id);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  sender_id uuid not null references public.profiles (id) on delete cascade,
  body text not null check (char_length(btrim(body)) between 1 and 2000),
  -- The product or order the buyer was looking at when they wrote, shown as context in the thread.
  product_id uuid references public.products (id) on delete set null,
  order_id uuid references public.orders (id) on delete set null,
  created_at timestamptz not null default now()
);

create index messages_conversation_id_created_at_idx
  on public.messages (conversation_id, created_at desc);

alter table public.conversations disable row level security;
alter table public.conversation_participants disable row level security;
alter table public.messages disable row level security;

revoke all on table public.conversations from anon, authenticated;
revoke all on table public.conversation_participants from anon, authenticated;
revoke all on table public.messages from anon, authenticated;

create function public.is_conversation_participant(p_conversation_id uuid)
returns boolean
language sql
stable
security definer set search_path = ''
as $$
  select exists (
    select 1
    from public.conversation_participants
    where conversation_id = p_conversation_id and user_id = auth.uid()
  );
$$;

create function public.send_message(
  p_body text,
  p_conversation_id uuid default null,
  p_shop_id uuid default null,
  p_product_id uuid default null,
  p_order_id uuid default null
)
returns public.messages
language plpgsql
security definer set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_body text := btrim(coalesce(p_body, ''));
  v_conversation_id uuid;
  v_owner_id uuid;
  v_message public.messages;
begin
  if v_user is null then
    raise exception 'Not signed in.' using errcode = '42501';
  end if;

  if char_length(v_body) not between 1 and 2000 then
    raise exception 'Messages must be between 1 and 2000 characters.' using errcode = '22023';
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
      raise exception 'You cannot message your own shop.' using errcode = '22023';
    end if;

    insert into public.conversations (buyer_id, shop_id)
    values (v_user, p_shop_id)
    on conflict (buyer_id, shop_id) do nothing
    returning id into v_conversation_id;

    if v_conversation_id is null then
      select id into v_conversation_id
      from public.conversations
      where buyer_id = v_user and shop_id = p_shop_id;
    end if;

    insert into public.conversation_participants (conversation_id, user_id)
    values (v_conversation_id, v_user), (v_conversation_id, v_owner_id)
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

  insert into public.messages (conversation_id, sender_id, body, product_id, order_id)
  values (v_conversation_id, v_user, v_body, p_product_id, p_order_id)
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

create function public.list_conversations()
returns table (
  id uuid,
  buyer_id uuid,
  shop_id uuid,
  counterpart_name text,
  last_message_body text,
  last_message_sender_id uuid,
  last_message_at timestamptz,
  unread_count integer
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

-- Newest first, so the client can feed the rows straight into an inverted list and pass the
-- oldest created_at back as p_before to page further up the thread.
create function public.get_messages(
  p_conversation_id uuid,
  p_before timestamptz default null,
  p_limit integer default 50
)
returns setof public.messages
language plpgsql
stable
security definer set search_path = ''
as $$
begin
  if not public.is_conversation_participant(p_conversation_id) then
    raise exception 'Conversation not found.' using errcode = '42501';
  end if;

  return query
    select *
    from public.messages
    where conversation_id = p_conversation_id
      and (p_before is null or created_at < p_before)
    order by created_at desc
    limit least(greatest(p_limit, 1), 100);
end;
$$;

create function public.find_conversation(p_shop_id uuid)
returns uuid
language sql
stable
security definer set search_path = ''
as $$
  select id
  from public.conversations
  where buyer_id = auth.uid() and shop_id = p_shop_id;
$$;

create function public.mark_conversation_read(p_conversation_id uuid)
returns void
language plpgsql
security definer set search_path = ''
as $$
begin
  update public.conversation_participants
  set last_read_at = now()
  where conversation_id = p_conversation_id and user_id = auth.uid();

  if not found then
    raise exception 'Conversation not found.' using errcode = '42501';
  end if;

  -- Lets the reader's other devices clear their unread badges too.
  perform realtime.send(
    jsonb_build_object('conversation_id', p_conversation_id),
    'read',
    'inbox:' || auth.uid()::text,
    false
  );
end;
$$;

-- The broadcast carries ids only, never the message body: the topic is public, so a
-- subscriber learns only that something changed and must refetch through get_messages,
-- which enforces participation.
create function public.broadcast_new_message()
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
      false
    );
  end loop;

  return new;
end;
$$;

create trigger messages_broadcast_new_message
  after insert on public.messages
  for each row execute function public.broadcast_new_message();

revoke all on function public.is_conversation_participant(uuid) from public, anon, authenticated;
revoke all on function public.broadcast_new_message() from public, anon, authenticated;

revoke all on function public.send_message(text, uuid, uuid, uuid, uuid) from public, anon;
revoke all on function public.list_conversations() from public, anon;
revoke all on function public.get_messages(uuid, timestamptz, integer) from public, anon;
revoke all on function public.find_conversation(uuid) from public, anon;
revoke all on function public.mark_conversation_read(uuid) from public, anon;

grant execute on function public.send_message(text, uuid, uuid, uuid, uuid) to authenticated;
grant execute on function public.list_conversations() to authenticated;
grant execute on function public.get_messages(uuid, timestamptz, integer) to authenticated;
grant execute on function public.find_conversation(uuid) to authenticated;
grant execute on function public.mark_conversation_read(uuid) to authenticated;
