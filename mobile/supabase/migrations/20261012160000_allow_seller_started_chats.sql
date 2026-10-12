-- Lets a shop owner start the conversation. A seller may open a thread only with a buyer who has
-- ordered from their shop, so sellers cannot cold-message arbitrary users. Buyers keep starting
-- conversations exactly as before.

drop function public.send_message(text, uuid, uuid, uuid, uuid);
drop function public.find_conversation(uuid);

create function public.can_seller_contact_buyer(p_shop_id uuid, p_buyer_id uuid)
returns boolean
language sql
stable
security definer set search_path = ''
as $$
  select exists (
    select 1
    from public.shops s
    join public.orders o on o.shop_id = s.id and o.buyer_id = p_buyer_id
    where s.id = p_shop_id and s.owner_id = auth.uid()
  );
$$;

create function public.send_message(
  p_body text,
  p_conversation_id uuid default null,
  p_shop_id uuid default null,
  p_product_id uuid default null,
  p_order_id uuid default null,
  p_buyer_id uuid default null
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
  v_buyer_id uuid;
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

create function public.find_conversation(p_shop_id uuid, p_buyer_id uuid default null)
returns uuid
language sql
stable
security definer set search_path = ''
as $$
  select c.id
  from public.conversations c
  where c.shop_id = p_shop_id
    and (
      (p_buyer_id is null and c.buyer_id = auth.uid())
      or (p_buyer_id is not null and c.buyer_id = p_buyer_id
          and public.can_seller_contact_buyer(p_shop_id, p_buyer_id))
    );
$$;

revoke all on function public.can_seller_contact_buyer(uuid, uuid) from public, anon, authenticated;
revoke all on function public.send_message(text, uuid, uuid, uuid, uuid, uuid) from public, anon;
revoke all on function public.find_conversation(uuid, uuid) from public, anon;

grant execute on function public.send_message(text, uuid, uuid, uuid, uuid, uuid) to authenticated;
grant execute on function public.find_conversation(uuid, uuid) to authenticated;
