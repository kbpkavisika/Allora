import type { Product } from '@/lib/products';
import { supabase } from '@/lib/supabase';

export const productSorts = ['Newest', 'Price: low to high', 'Price: high to low'] as const;

export type ProductSort = (typeof productSorts)[number];

export const BROWSE_PAGE_SIZE = 24;

export interface BrowseParams {
  search: string;
  category: string | null;
  sort: ProductSort;
  page: number;
}

export interface BrowseResult {
  products: Product[];
  error: unknown;
}

export async function fetchProducts({
  search,
  category,
  sort,
  page,
}: BrowseParams): Promise<BrowseResult> {
  let query = supabase.from('products').select('*');

  if (category) {
    query = query.eq('category', category);
  }

  const term = search.trim();
  if (term) {
    query = query.ilike('name', `%${term}%`);
  }

  const ordered =
    sort === 'Price: low to high'
      ? query.order('price', { ascending: true })
      : sort === 'Price: high to low'
        ? query.order('price', { ascending: false })
        : query.order('created_at', { ascending: false });

  const from = page * BROWSE_PAGE_SIZE;
  const { data, error } = await ordered.range(from, from + BROWSE_PAGE_SIZE - 1);

  return { products: (data ?? []) as Product[], error };
}
