-- Products listed by a seller through the add-product wizard. Many rows per shop.

create table public.products (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops (id) on delete cascade,
  name text not null,
  description text not null,
  price numeric(10, 2) not null check (price > 0),
  stock_quantity integer not null default 0 check (stock_quantity >= 0),
  category text not null,
  -- Cloudinary secure urls; the images themselves live outside Supabase.
  photos text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint products_photos_max_six
    check (array_length(photos, 1) is null or array_length(photos, 1) <= 6)
);

create index products_shop_id_idx on public.products (shop_id);

create function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger products_touch_updated_at
  before update on public.products
  for each row execute function public.touch_updated_at();
