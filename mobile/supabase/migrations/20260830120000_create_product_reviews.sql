-- Buyer reviews of a product. One review per buyer per product; the reviews screen reads the
-- rows and derives the average and the star distribution client-side.

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  -- Points at profiles rather than auth.users so PostgREST can embed the author's display
  -- name. profiles.id is itself a foreign key to auth.users, so integrity is unchanged.
  author_id uuid not null references public.profiles (id) on delete cascade,
  -- Set when the review is tied to a purchase; drives the "Verified purchase" meta line.
  order_id uuid references public.orders (id) on delete set null,
  rating integer not null check (rating between 1 and 5),
  headline text not null,
  body text not null,
  -- Cloudinary secure urls, same as products.photos.
  photos text[] not null default '{}',
  helpful_count integer not null default 0 check (helpful_count >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint reviews_one_per_product_per_author unique (product_id, author_id),
  constraint reviews_photos_max_six
    check (array_length(photos, 1) is null or array_length(photos, 1) <= 6)
);

create index reviews_product_id_idx on public.reviews (product_id);
create index reviews_author_id_idx on public.reviews (author_id);

create trigger reviews_touch_updated_at
  before update on public.reviews
  for each row execute function public.touch_updated_at();

alter table public.reviews disable row level security;
