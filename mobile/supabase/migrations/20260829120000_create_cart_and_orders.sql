-- Buyer cart plus the shared orders schema used by both the buyer order screens and the
-- seller order management screens. One order row per shop per checkout.

create table public.cart_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete cascade,
  quantity integer not null check (quantity > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint cart_items_one_row_per_product unique (user_id, product_id)
);

create index cart_items_user_id_idx on public.cart_items (user_id);

create trigger cart_items_touch_updated_at
  before update on public.cart_items
  for each row execute function public.touch_updated_at();

alter table public.cart_items disable row level security;

-- Human-facing order numbers like ALL-24188. Starts past the ALL-24187 shown in the mockups.
create sequence public.order_number_seq start 24188;

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique
    default 'ALL-' || lpad(nextval('public.order_number_seq')::text, 5, '0'),
  buyer_id uuid not null references auth.users (id) on delete cascade,
  shop_id uuid references public.shops (id) on delete set null,
  status text not null default 'new' check (status in ('new', 'processing', 'completed')),
  payment_method text check (payment_method in ('payhere', 'cod')),
  payment_status text not null default 'pending'
    check (payment_status in ('pending', 'paid', 'failed')),
  payment_reference text,
  subtotal numeric(10, 2) not null check (subtotal >= 0),
  total numeric(10, 2) not null check (total >= 0),
  ship_name text,
  ship_line1 text,
  ship_line2 text,
  ship_city text,
  ship_region text,
  ship_postal_code text,
  ship_country text,
  ship_note text,
  placed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index orders_buyer_id_idx on public.orders (buyer_id);
create index orders_shop_id_idx on public.orders (shop_id);

create trigger orders_touch_updated_at
  before update on public.orders
  for each row execute function public.touch_updated_at();

alter table public.orders disable row level security;

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  product_id uuid references public.products (id) on delete set null,
  -- Snapshotted at purchase so the line stays correct if the product later changes.
  product_name text not null,
  product_photo text,
  unit_price numeric(10, 2) not null check (unit_price >= 0),
  quantity integer not null check (quantity > 0)
);

create index order_items_order_id_idx on public.order_items (order_id);

alter table public.order_items disable row level security;

create table public.order_returns (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  buyer_id uuid not null references auth.users (id) on delete cascade,
  reason text not null
    check (reason in ('damaged', 'wrong_item', 'changed_mind', 'other')),
  details text,
  status text not null default 'open' check (status in ('open', 'resolved')),
  created_at timestamptz not null default now()
);

create index order_returns_order_id_idx on public.order_returns (order_id);

alter table public.order_returns disable row level security;
