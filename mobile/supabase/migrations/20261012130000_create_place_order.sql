-- Places a checkout as one transaction: the product rows are locked, stock is checked and
-- decremented, prices and names come from the products table rather than the client, one order
-- is created per shop, and the purchased lines leave the cart. Any failure rolls all of it back,
-- so an order can never exist without its items and stock can never go negative.

create function public.place_order(
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

  if p_payment_status is null or p_payment_status not in ('pending', 'paid') then
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
      v_user, v_shop.shop_id, 'new', p_payment_method, p_payment_status, p_payment_reference,
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

  delete from public.cart_items c
  where c.user_id = v_user
    and c.product_id in (select l.product_id from jsonb_to_recordset(v_lines) as l (product_id uuid));
end;
$$;

revoke all on function public.place_order(jsonb, text, text, text, jsonb) from public, anon;
grant execute on function public.place_order(jsonb, text, text, text, jsonb) to authenticated;
