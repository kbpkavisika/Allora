create table public.payments (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid not null references auth.users (id) on delete cascade,
  payhere_order_id text not null unique,
  payment_id text unique,
  amount numeric(10, 2) not null check (amount > 0),
  currency text not null default 'LKR' check (currency = 'LKR'),
  status text not null default 'pending'
    check (status in ('pending', 'paid', 'failed', 'cancelled')),
  payment_method text not null default 'payhere'
    check (payment_method = 'payhere'),
  receipt_sent boolean not null default false,
  receipt_sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index payments_buyer_id_idx on public.payments (buyer_id);
create index payments_status_idx on public.payments (status);

create trigger payments_touch_updated_at
  before update on public.payments
  for each row execute function public.touch_updated_at();

alter table public.payments enable row level security;

create policy "Payments are viewable by owner"
  on public.payments for select
  to authenticated
  using (auth.uid() = buyer_id);

create policy "Payments are insertable by owner when pending"
  on public.payments for insert
  to authenticated
  with check (
    auth.uid() = buyer_id
    and status = 'pending'
    and payment_id is null
    and payment_method = 'payhere'
    and receipt_sent = false
    and receipt_sent_at is null
    and currency = 'LKR'
  );
