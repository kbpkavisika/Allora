-- Delivery problems reported by a buyer against an order, and resolved by the seller. Separate
-- from order_returns: a return is about the item, an issue here is about the delivery itself.

create table public.delivery_issues (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  buyer_id uuid not null references auth.users (id) on delete cascade,
  kind text not null
    check (kind in ('not_arrived', 'arrived_damaged', 'wrong_address', 'missing_items', 'other')),
  details text,
  status text not null default 'open' check (status in ('open', 'resolved')),
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index delivery_issues_order_id_idx on public.delivery_issues (order_id);

-- One live problem per order, so the seller always has a single thing to resolve. Same shape as
-- addresses_one_default_per_user.
create unique index delivery_issues_one_open_per_order
  on public.delivery_issues (order_id)
  where status = 'open';

create trigger delivery_issues_touch_updated_at
  before update on public.delivery_issues
  for each row execute function public.touch_updated_at();

alter table public.delivery_issues disable row level security;
