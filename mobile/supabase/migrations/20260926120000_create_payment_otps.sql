create table public.payment_otps (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid not null references auth.users (id) on delete cascade,
  phone text not null,
  code_hash text not null,
  expires_at timestamptz not null,
  used boolean not null default false,
  used_at timestamptz,
  attempt_count integer not null default 0 check (attempt_count >= 0),
  created_at timestamptz not null default now()
);

create index payment_otps_buyer_created_at_idx
  on public.payment_otps (buyer_id, created_at desc);

create unique index payment_otps_one_active_per_buyer_idx
  on public.payment_otps (buyer_id)
  where not used;

alter table public.payment_otps disable row level security;

revoke all on table public.payment_otps from anon;
revoke all on table public.payment_otps from authenticated;
