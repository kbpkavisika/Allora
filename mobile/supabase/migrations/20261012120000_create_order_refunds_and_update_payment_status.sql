alter table public.orders drop constraint if exists orders_payment_status_check;
alter table public.orders add constraint orders_payment_status_check
  check (payment_status in ('pending', 'paid', 'failed', 'refunded', 'partially_refunded'));

create sequence if not exists public.refund_number_seq start 100001;

create table public.order_refunds (
  id uuid primary key default gen_random_uuid(),
  refund_number text not null unique
    default 'REF-' || nextval('public.refund_number_seq')::text,
  order_id uuid not null references public.orders (id) on delete cascade,
  buyer_id uuid not null references auth.users (id) on delete cascade,
  amount numeric(10, 2) not null check (amount > 0),
  refund_type text not null check (refund_type in ('full', 'partial')),
  reason text not null check (reason in ('damaged', 'wrong_item', 'not_received', 'not_as_described', 'not_needed', 'other')),
  reason_label text,
  details text,
  status text not null default 'processing'
    check (status in ('requested', 'processing', 'refunded', 'failed')),
  payment_reference text,
  currency text not null default 'LKR',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index order_refunds_order_id_idx on public.order_refunds (order_id);
create index order_refunds_buyer_id_idx on public.order_refunds (buyer_id);
create index order_refunds_status_idx on public.order_refunds (status);

create trigger order_refunds_touch_updated_at
  before update on public.order_refunds
  for each row execute function public.touch_updated_at();

alter table public.order_refunds disable row level security;
