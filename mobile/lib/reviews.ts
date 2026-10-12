import { supabase } from '@/lib/supabase';
import i18n from '@/lib/i18n';

export interface Review {
  id: string;
  product_id: string;
  author_id: string;
  order_id: string | null;
  rating: number;
  headline: string;
  body: string;
  photos: string[];
  helpful_count: number;
  created_at: string;
  updated_at: string;
  author: { full_name: string | null } | null;
}

export const reviewSorts = ['recent', 'helpful', 'highest', 'lowest'] as const;

export type ReviewSort = (typeof reviewSorts)[number];

export function reviewSortLabel(sort: string): string {
  return i18n.t(`reviews.sort.${sort}`);
}

export const STAR_VALUES = [5, 4, 3, 2, 1] as const;

export interface RatingSummary {
  average: number;
  total: number;
  counts: Record<number, number>;
}

export function summarizeReviews(reviews: Pick<Review, 'rating'>[]): RatingSummary {
  const counts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let sum = 0;

  for (const review of reviews) {
    counts[review.rating] = (counts[review.rating] ?? 0) + 1;
    sum += review.rating;
  }

  return {
    average: reviews.length > 0 ? sum / reviews.length : 0,
    total: reviews.length,
    counts,
  };
}

export function ratingShare(summary: RatingSummary, star: number): number {
  return summary.total > 0 ? (summary.counts[star] ?? 0) / summary.total : 0;
}

export function formatAverage(average: number): string {
  return average.toFixed(1);
}

export function formatReviewCount(total: number): string {
  return i18n.t('reviews.count', { count: total });
}

export function reviewerName(fullName: string | null): string {
  const parts = fullName?.trim().split(/\s+/).filter(Boolean) ?? [];
  if (parts.length === 0) {
    return i18n.t('reviews.anonymous');
  }
  const surname = parts.length > 1 ? ` ${parts[parts.length - 1][0].toUpperCase()}.` : '';
  return `${parts[0]}${surname}`;
}

const DAY_MS = 24 * 60 * 60 * 1000;

export function formatReviewAge(createdAt: string): string {
  const days = Math.floor((Date.now() - new Date(createdAt).getTime()) / DAY_MS);

  if (days <= 0) return i18n.t('reviews.age.today');
  if (days === 1) return i18n.t('reviews.age.yesterday');
  if (days < 7) return i18n.t('reviews.age.days', { count: days });

  const weeks = Math.floor(days / 7);
  if (weeks < 5) return i18n.t('reviews.age.weeks', { count: weeks });

  const months = Math.floor(days / 30);
  if (months < 12) return i18n.t('reviews.age.months', { count: months });

  const years = Math.floor(days / 365);
  return i18n.t('reviews.age.years', { count: years });
}

export function reviewMeta(review: Review): string {
  const age = formatReviewAge(review.created_at);
  return review.order_id ? i18n.t('reviews.verified', { age }) : age;
}

// The product page only needs the aggregate, so it reads the ratings alone rather than
// every review body and photo array.
export async function fetchRatingSummary(productId: string): Promise<RatingSummary> {
  const { data } = await supabase.from('reviews').select('rating').eq('product_id', productId);

  return summarizeReviews((data ?? []) as Pick<Review, 'rating'>[]);
}

export interface FetchReviewsResult {
  reviews: Review[];
  error: unknown;
}

export async function fetchProductReviews(
  productId: string,
  sort: ReviewSort
): Promise<FetchReviewsResult> {
  const query = supabase
    .from('reviews')
    .select('*, author:profiles(full_name)')
    .eq('product_id', productId);

  const ordered =
    sort === 'helpful'
      ? query.order('helpful_count', { ascending: false })
      : sort === 'highest'
        ? query.order('rating', { ascending: false })
        : sort === 'lowest'
          ? query.order('rating', { ascending: true })
          : query.order('created_at', { ascending: false });

  const { data, error } = await ordered;

  return { reviews: (data ?? []) as unknown as Review[], error };
}

// Reviews left by someone who actually bought the product carry the "Verified purchase" line,
// so the form looks for one of the buyer's orders containing it before inserting.
export async function findPurchaseOrderId(
  productId: string,
  buyerId: string
): Promise<string | null> {
  const { data } = await supabase
    .from('order_items')
    .select('order_id, orders!inner(buyer_id)')
    .eq('product_id', productId)
    .eq('orders.buyer_id', buyerId)
    .limit(1)
    .maybeSingle();

  return (data?.order_id as string | undefined) ?? null;
}

export interface SubmitReviewInput {
  productId: string;
  authorId: string;
  orderId?: string | null;
  rating: number;
  headline: string;
  body: string;
  photos: string[];
}

export async function submitReview({
  productId,
  authorId,
  orderId,
  rating,
  headline,
  body,
  photos,
}: SubmitReviewInput): Promise<{ error: unknown }> {
  const { error } = await supabase.from('reviews').insert({
    product_id: productId,
    author_id: authorId,
    order_id: orderId ?? null,
    rating,
    headline: headline.trim(),
    body: body.trim(),
    photos,
  });

  return { error };
}
