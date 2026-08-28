-- Seller shop created during the store-setup wizard. One row per seller.

create table public.shops (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null unique references auth.users (id) on delete cascade,
  name text not null,
  category text not null,
  city text not null,
  phone text not null,
  pickup_enabled boolean not null default true,
  delivery_enabled boolean not null default false,
  photo_url text,
  created_at timestamptz not null default now()
);

alter table public.shops enable row level security;

create policy "Shops are viewable by owner"
  on public.shops for select
  using (auth.uid() = owner_id);

create policy "Shops are insertable by owner"
  on public.shops for insert
  with check (auth.uid() = owner_id);

create policy "Shops are updatable by owner"
  on public.shops for update
  using (auth.uid() = owner_id);

create policy "Shops are deletable by owner"
  on public.shops for delete
  using (auth.uid() = owner_id);
