-- Products listed by a seller through the add-product wizard. Many rows per shop.

create table public.products (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops (id) on delete cascade,
  name text not null,
  description text not null,
  price numeric(10, 2) not null check (price > 0),
  stock_quantity integer not null default 0 check (stock_quantity >= 0),
  category text not null,
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

-- Product photos are picked on the device as local file uris, so they need somewhere to live
-- before another device can render them. Uploads are namespaced by user id.
insert into storage.buckets (id, name, public)
values ('product-photos', 'product-photos', true)
on conflict (id) do nothing;

create policy "Product photos are publicly readable"
  on storage.objects for select
  using (bucket_id = 'product-photos');

create policy "Sellers can upload their own product photos"
  on storage.objects for insert
  with check (
    bucket_id = 'product-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Sellers can replace their own product photos"
  on storage.objects for update
  using (
    bucket_id = 'product-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Sellers can delete their own product photos"
  on storage.objects for delete
  using (
    bucket_id = 'product-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
