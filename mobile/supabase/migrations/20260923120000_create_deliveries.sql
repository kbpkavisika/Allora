-- Delivery record for an order. Exactly one row per order, created by a trigger so every
-- order placed through checkout is trackable without the client having to insert it.

create table public.deliveries (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null unique references public.orders (id) on delete cascade,
  status text not null default 'pending'
    check (status in ('pending', 'in_transit', 'delivered', 'failed')),
  courier_name text,
  tracking_number text,
  estimated_at timestamptz,
  delivered_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index deliveries_order_id_idx on public.deliveries (order_id);

create trigger deliveries_touch_updated_at
  before update on public.deliveries
  for each row execute function public.touch_updated_at();

create function public.create_delivery_for_order()
returns trigger
language plpgsql
as $$
begin
  insert into public.deliveries (order_id) values (new.id);
  return new;
end;
$$;

create trigger orders_create_delivery
  after insert on public.orders
  for each row execute function public.create_delivery_for_order();

insert into public.deliveries (order_id)
select id from public.orders
on conflict (order_id) do nothing;

alter table public.deliveries disable row level security;
