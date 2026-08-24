-- Buyer profile and shipping address tables for the Account tab.

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  phone text,
  avatar_url text,
  sms_order_updates boolean not null default true,
  preferred_carrier text not null default 'Any',
  leave_at_door_default boolean not null default false,
  two_factor_enabled boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Profiles are viewable by owner"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Profiles are insertable by owner"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Profiles are updatable by owner"
  on public.profiles for update
  using (auth.uid() = id);

create table public.addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  label text not null,
  line1 text not null,
  line2 text,
  city text not null,
  region text not null,
  postal_code text not null,
  country text not null default 'Canada',
  delivery_note text,
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);

create unique index addresses_one_default_per_user
  on public.addresses (user_id)
  where is_default;

alter table public.addresses enable row level security;

create policy "Addresses are viewable by owner"
  on public.addresses for select
  using (auth.uid() = user_id);

create policy "Addresses are insertable by owner"
  on public.addresses for insert
  with check (auth.uid() = user_id);

create policy "Addresses are updatable by owner"
  on public.addresses for update
  using (auth.uid() = user_id);

create policy "Addresses are deletable by owner"
  on public.addresses for delete
  using (auth.uid() = user_id);

-- Auto-provision a profile row whenever a new auth user is created.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
