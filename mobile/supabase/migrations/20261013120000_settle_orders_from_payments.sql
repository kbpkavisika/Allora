-- PayHere orders are now placed before the buyer pays. place_order reserves the stock and creates
-- the orders with payment pending, start_payhere_payment opens one payments row for exactly those
-- orders with a server-computed amount, and when the webhook marks that row paid the orders follow.
-- If the buyer backs out of PayHere, abandon_payhere_checkout puts the stock back and removes the
-- unpaid orders, which were never real purchases. Cash on delivery orders become paid on delivery.

alter table public.orders
  add column payment_id uuid references public.payments (id) on delete set null;

create index orders_payment_id_idx on public.orders (payment_id);

-- Before this change a PayHere order was only created after PayHere reported the payment complete,
-- so every existing PayHere order was paid even though its status was never updated.
update public.orders o
set payment_id = p.id
from public.payments p
where o.payment_method = 'payhere'
  and o.payment_reference is not null
  and o.payment_reference = p.payment_id;

update public.orders
set payment_status = 'paid'
where payment_method = 'payhere' and payment_status = 'pending';

update public.orders
set payment_status = 'paid'
where payment_method = 'cod' and payment_status = 'pending' and status = 'completed';

create or replace function public.place_order(
  p_items jsonb,
  p_payment_method text,
  p_payment_status text default 'pending',
  p_payment_reference text default null,
  p_shipping jsonb default '{}'::jsonb
)
returns setof public.orders
language plpgsql
security definer set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_lines jsonb;
  v_line record;
  v_shop record;
  v_order public.orders;
begin
  if v_user is null then
    raise exception 'Not signed in.' using errcode = '42501';
  end if;

  if p_payment_method is null or p_payment_method not in ('payhere', 'cod') then
    raise exception 'Unknown payment method.' using errcode = '22023';
  end if;

  -- Only a confirmed PayHere payment may mark an order paid, never the client.
  if p_payment_status is distinct from 'pending' then
    raise exception 'Unknown payment status.' using errcode = '22023';
  end if;

  select jsonb_agg(jsonb_build_object('product_id', product_id, 'quantity', quantity))
  into v_lines
  from (
    select (item ->> 'product_id')::uuid as product_id, sum((item ->> 'quantity')::integer) as quantity
    from jsonb_array_elements(coalesce(p_items, '[]'::jsonb)) as item
    group by 1
  ) grouped;

  if v_lines is null then
    raise exception 'Your cart is empty.' using errcode = '22023';
  end if;

  if exists (
    select 1
    from jsonb_to_recordset(v_lines) as l (product_id uuid, quantity integer)
    where l.product_id is null or l.quantity is null or l.quantity <= 0
  ) then
    raise exception 'Every line needs a product and a quantity of at least 1.' using errcode = '22023';
  end if;

  -- Locked in id order so two checkouts sharing products cannot deadlock.
  perform 1
  from public.products p
  where p.id in (select l.product_id from jsonb_to_recordset(v_lines) as l (product_id uuid))
  order by p.id
  for update;

  for v_line in
    select l.product_id, l.quantity, p.stock_quantity
    from jsonb_to_recordset(v_lines) as l (product_id uuid, quantity integer)
    left join public.products p on p.id = l.product_id
  loop
    if v_line.stock_quantity is null then
      raise exception 'A product in your cart is no longer available.'
        using errcode = 'P0002', detail = v_line.product_id::text;
    end if;

    if v_line.quantity > v_line.stock_quantity then
      raise exception 'Not enough stock.'
        using errcode = 'P0001', detail = v_line.product_id::text;
    end if;
  end loop;

  for v_shop in
    select p.shop_id, sum(p.price * l.quantity) as subtotal
    from jsonb_to_recordset(v_lines) as l (product_id uuid, quantity integer)
    join public.products p on p.id = l.product_id
    group by p.shop_id
  loop
    insert into public.orders (
      buyer_id, shop_id, status, payment_method, payment_status, payment_reference,
      subtotal, total,
      ship_name, ship_line1, ship_line2, ship_city, ship_region, ship_postal_code,
      ship_country, ship_note
    )
    values (
      v_user, v_shop.shop_id, 'new', p_payment_method, 'pending', p_payment_reference,
      v_shop.subtotal, v_shop.subtotal,
      p_shipping ->> 'ship_name', p_shipping ->> 'ship_line1', p_shipping ->> 'ship_line2',
      p_shipping ->> 'ship_city', p_shipping ->> 'ship_region', p_shipping ->> 'ship_postal_code',
      p_shipping ->> 'ship_country', p_shipping ->> 'ship_note'
    )
    returning * into v_order;

    insert into public.order_items (
      order_id, product_id, product_name, product_photo, unit_price, quantity
    )
    select v_order.id, p.id, p.name, p.photos[1], p.price, l.quantity
    from jsonb_to_recordset(v_lines) as l (product_id uuid, quantity integer)
    join public.products p on p.id = l.product_id
    where p.shop_id = v_shop.shop_id;

    return next v_order;
  end loop;

  update public.products p
  set stock_quantity = p.stock_quantity - l.quantity
  from jsonb_to_recordset(v_lines) as l (product_id uuid, quantity integer)
  where p.id = l.product_id;

  -- A PayHere cart is kept until the payment succeeds so a cancelled payment loses nothing.
  if p_payment_method = 'cod' then
    delete from public.cart_items c
    where c.user_id = v_user
      and c.product_id in (select l.product_id from jsonb_to_recordset(v_lines) as l (product_id uuid));
  end if;
end;
$$;

create function public.release_unpaid_order(p_order_id uuid)
returns void
language plpgsql
security definer set search_path = ''
as $$
begin
  update public.products p
  set stock_quantity = p.stock_quantity + i.quantity
  from (
    select product_id, sum(quantity) as quantity
    from public.order_items
    where order_id = p_order_id and product_id is not null
    group by product_id
  ) i
  where p.id = i.product_id;

  delete from public.orders where id = p_order_id;
end;
$$;

create function public.start_payhere_payment(p_order_ids uuid[])
returns table (payment_id uuid, payhere_order_id text, amount numeric, currency text)
language plpgsql
security definer set search_path = ''
as $$
#variable_conflict use_column
declare
  v_user uuid := auth.uid();
  v_requested integer := coalesce(cardinality(array(select distinct unnest(p_order_ids))), 0);
  v_found integer;
  v_amount numeric(10, 2);
  v_payment public.payments;
begin
  if v_user is null then
    raise exception 'Not signed in.' using errcode = '42501';
  end if;

  if v_requested = 0 then
    raise exception 'No orders to pay for.' using errcode = '22023';
  end if;

  perform 1 from public.orders o where o.id = any (p_order_ids) order by o.id for update;

  select count(*), sum(o.total)
  into v_found, v_amount
  from public.orders o
  where o.id = any (p_order_ids)
    and o.buyer_id = v_user
    and o.payment_method = 'payhere'
    and o.payment_status = 'pending'
    and o.status = 'new'
    and o.payment_id is null;

  if v_found <> v_requested then
    raise exception 'These orders cannot be paid for.' using errcode = '22023';
  end if;

  if v_amount is null or v_amount <= 0 then
    raise exception 'Nothing to pay.' using errcode = '22023';
  end if;

  insert into public.payments (buyer_id, payhere_order_id, amount)
  values (
    v_user,
    'CART-' || (extract(epoch from clock_timestamp()) * 1000)::bigint || '-'
      || left(replace(gen_random_uuid()::text, '-', ''), 12),
    v_amount
  )
  returning * into v_payment;

  update public.orders o set payment_id = v_payment.id where o.id = any (p_order_ids);

  return query select v_payment.id, v_payment.payhere_order_id, v_payment.amount, v_payment.currency;
end;
$$;

create function public.abandon_payhere_checkout(p_order_ids uuid[])
returns void
language plpgsql
security definer set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_order record;
begin
  if v_user is null then
    raise exception 'Not signed in.' using errcode = '42501';
  end if;

  for v_order in
    select o.id, o.payment_id
    from public.orders o
    where o.id = any (p_order_ids)
      and o.buyer_id = v_user
      and o.payment_method = 'payhere'
      and o.payment_status = 'pending'
      and o.status = 'new'
    order by o.id
    for update
  loop
    perform public.release_unpaid_order(v_order.id);

    update public.payments
    set status = 'cancelled'
    where id = v_order.payment_id and status = 'pending';
  end loop;
end;
$$;

create function public.settle_orders_from_payment()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  if new.status = 'paid' then
    update public.orders
    set payment_status = 'paid',
        payment_reference = coalesce(new.payment_id, payment_reference)
    where payment_id = new.id and payment_status = 'pending';

    delete from public.cart_items c
    using public.orders o
    join public.order_items i on i.order_id = o.id
    where o.payment_id = new.id
      and c.user_id = o.buyer_id
      and c.product_id = i.product_id;
  end if;

  return new;
end;
$$;

create trigger payments_settle_orders
  after update of status on public.payments
  for each row
  when (new.status is distinct from old.status)
  execute function public.settle_orders_from_payment();

create or replace function public.sync_order_status_from_delivery()
returns trigger
language plpgsql
as $$
begin
  if new.status in ('packed', 'shipped', 'failed') then
    update public.orders set status = 'processing'
    where id = new.order_id and status = 'new';
  elsif new.status = 'delivered' then
    update public.orders
    set status = 'completed',
        payment_status = case
          when payment_method = 'cod' and payment_status = 'pending' then 'paid'
          else payment_status
        end
    where id = new.order_id;
  end if;

  return new;
end;
$$;

revoke all on function public.release_unpaid_order(uuid) from public, anon, authenticated;
revoke all on function public.settle_orders_from_payment() from public, anon, authenticated;
revoke all on function public.start_payhere_payment(uuid[]) from public, anon;
revoke all on function public.abandon_payhere_checkout(uuid[]) from public, anon;

grant execute on function public.start_payhere_payment(uuid[]) to authenticated;
grant execute on function public.abandon_payhere_checkout(uuid[]) to authenticated;
