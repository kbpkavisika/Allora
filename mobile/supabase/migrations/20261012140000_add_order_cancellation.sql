-- Order cancellation. A buyer may cancel their own order while it is still new and nothing has
-- been paid online; a seller may cancel or reject an order of their shop until it is delivered.
-- Cancelling puts the purchased quantities back into stock in the same transaction.

alter table public.orders drop constraint if exists orders_status_check;
alter table public.orders add constraint orders_status_check
  check (status in ('new', 'processing', 'completed', 'cancelled'));

alter table public.orders
  add column cancelled_at timestamptz,
  add column cancelled_by text check (cancelled_by in ('buyer', 'seller')),
  add column cancel_reason text check (char_length(cancel_reason) <= 500);

create function public.cancel_order(p_order_id uuid, p_reason text default null)
returns public.orders
language plpgsql
security definer set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_reason text := nullif(btrim(coalesce(p_reason, '')), '');
  v_order public.orders;
  v_is_seller boolean;
begin
  if v_user is null then
    raise exception 'Not signed in.' using errcode = '42501';
  end if;

  select * into v_order from public.orders where id = p_order_id for update;

  if v_order.id is null then
    raise exception 'Order not found.' using errcode = 'P0002';
  end if;

  v_is_seller := exists (
    select 1 from public.shops where id = v_order.shop_id and owner_id = v_user
  );

  if not v_is_seller and v_order.buyer_id <> v_user then
    raise exception 'Order not found.' using errcode = 'P0002';
  end if;

  if v_order.status = 'cancelled' then
    raise exception 'This order is already cancelled.' using errcode = '22023';
  end if;

  if v_is_seller then
    if v_order.status not in ('new', 'processing') then
      raise exception 'Delivered orders cannot be cancelled.' using errcode = '22023';
    end if;

    if v_reason is null then
      raise exception 'Give the buyer a reason for cancelling.' using errcode = '22023';
    end if;
  else
    if v_order.status <> 'new' then
      raise exception 'The seller has already started on this order.' using errcode = '22023';
    end if;

    if v_order.payment_method = 'payhere' and v_order.payment_status = 'paid' then
      raise exception 'Paid orders need a refund request instead.' using errcode = '22023';
    end if;
  end if;

  if char_length(v_reason) > 500 then
    raise exception 'Keep the reason under 500 characters.' using errcode = '22023';
  end if;

  update public.products p
  set stock_quantity = p.stock_quantity + i.quantity
  from (
    select product_id, sum(quantity) as quantity
    from public.order_items
    where order_id = p_order_id and product_id is not null
    group by product_id
  ) i
  where p.id = i.product_id;

  update public.orders
  set status = 'cancelled',
      cancelled_at = now(),
      cancelled_by = case when v_is_seller then 'seller' else 'buyer' end,
      cancel_reason = v_reason
  where id = p_order_id
  returning * into v_order;

  return v_order;
end;
$$;

-- A cancelled order is final, so its delivery can no longer move forward.
create function public.prevent_delivery_update_on_cancelled_order()
returns trigger
language plpgsql
as $$
begin
  if exists (select 1 from public.orders where id = new.order_id and status = 'cancelled') then
    raise exception 'This order was cancelled.' using errcode = '22023';
  end if;

  return new;
end;
$$;

create trigger deliveries_block_cancelled_order
  before update on public.deliveries
  for each row execute function public.prevent_delivery_update_on_cancelled_order();

revoke all on function public.cancel_order(uuid, text) from public, anon;
grant execute on function public.cancel_order(uuid, text) to authenticated;
