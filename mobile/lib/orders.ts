import type { BadgeVariant } from '@/components/ui/Badge';

/**
 * Read contract for the seller Orders screen. The `orders` table itself is owned by the
 * buyer-side checkout work, so nothing here creates or writes it — these are the fields the
 * seller screen needs back once that table exists.
 */

export const orderStatuses = ['new', 'processing', 'completed'] as const;

export type OrderStatus = (typeof orderStatuses)[number];

export interface SellerOrderItem {
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
}

export interface SellerOrder {
  id: string;
  shop_id: string;
  order_number: string;
  buyer_name: string;
  status: OrderStatus;
  total: number;
  placed_at: string;
  items: SellerOrderItem[];
}

interface StatusPresentation {
  label: string;
  tone: string;
  variant: BadgeVariant;
}

const STATUS: Record<OrderStatus, StatusPresentation> = {
  new: { label: 'New', tone: 'bg-accent', variant: 'warning' },
  processing: { label: 'Processing', tone: 'bg-info', variant: 'neutral' },
  completed: { label: 'Completed', tone: 'bg-success', variant: 'success' },
};

export function statusPresentation(status: OrderStatus): StatusPresentation {
  return STATUS[status];
}

const NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
  new: 'processing',
  processing: 'completed',
};

const NEXT_ACTION_LABEL: Partial<Record<OrderStatus, string>> = {
  new: 'Mark as processing',
  processing: 'Mark as completed',
};

export function nextStatus(status: OrderStatus): OrderStatus | null {
  return NEXT_STATUS[status] ?? null;
}

export function nextStatusLabel(status: OrderStatus): string | null {
  return NEXT_ACTION_LABEL[status] ?? null;
}

export function itemSummary(items: SellerOrderItem[]): string {
  const [first, ...rest] = items;

  if (!first) {
    return 'No items';
  }

  const line = `${first.product_name} × ${first.quantity}`;
  return rest.length > 0 ? `${line} and ${rest.length} more` : line;
}

export function formatPlacedAt(placedAt: string): string {
  const placed = new Date(placedAt);
  const today = new Date();

  const isToday =
    placed.getFullYear() === today.getFullYear() &&
    placed.getMonth() === today.getMonth() &&
    placed.getDate() === today.getDate();

  return isToday
    ? 'today'
    : placed.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
