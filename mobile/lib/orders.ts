import type { BadgeVariant } from '@/components/ui/Badge';

export const orderStatuses = ['new', 'processing', 'completed'] as const;

export type OrderStatus = (typeof orderStatuses)[number];

export type PaymentMethod = 'payhere' | 'cod';
export type PaymentStatus = 'pending' | 'paid' | 'failed';

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name: string;
  product_photo: string | null;
  unit_price: number;
  quantity: number;
}

export interface Order {
  id: string;
  order_number: string;
  buyer_id: string;
  shop_id: string | null;
  status: OrderStatus;
  payment_method: PaymentMethod | null;
  payment_status: PaymentStatus;
  payment_reference: string | null;
  subtotal: number;
  total: number;
  ship_name: string | null;
  ship_line1: string | null;
  ship_line2: string | null;
  ship_city: string | null;
  ship_region: string | null;
  ship_postal_code: string | null;
  ship_country: string | null;
  ship_note: string | null;
  placed_at: string;
  created_at: string;
  updated_at: string;
  items: OrderItem[];
}

// Kept as aliases so the seller screens that imported the old names keep compiling.
export type SellerOrder = Order;
export type SellerOrderItem = OrderItem;

export const returnReasons = ['damaged', 'wrong_item', 'changed_mind', 'other'] as const;

export type ReturnReason = (typeof returnReasons)[number];

export const RETURN_REASONS: readonly { value: ReturnReason; label: string }[] = [
  { value: 'damaged', label: 'Damaged item' },
  { value: 'wrong_item', label: 'Wrong item' },
  { value: 'changed_mind', label: 'Changed my mind' },
  { value: 'other', label: 'Other' },
];

export interface OrderReturn {
  id: string;
  order_id: string;
  buyer_id: string;
  reason: ReturnReason;
  details: string | null;
  status: 'open' | 'resolved';
  created_at: string;
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

interface TrackingStep {
  current: number;
  total: number;
  label: string;
}

const TRACKING: Record<OrderStatus, TrackingStep> = {
  new: { current: 1, total: 3, label: 'Order placed' },
  processing: { current: 2, total: 3, label: 'Seller preparing your order' },
  completed: { current: 3, total: 3, label: 'Completed' },
};

export function trackingStep(status: OrderStatus): TrackingStep {
  return TRACKING[status];
}

export function itemSummary(items: OrderItem[]): string {
  const [first, ...rest] = items;

  if (!first) {
    return 'No items';
  }

  const restCount = rest.reduce((sum, item) => sum + item.quantity, 0);
  return restCount > 0 ? `${first.product_name} and ${restCount} more` : first.product_name;
}

export function orderItemCount(items: OrderItem[]): number {
  return items.reduce((sum, item) => sum + item.quantity, 0);
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

export function formatMoney(amount: number): string {
  const [whole, fraction] = Number(amount).toFixed(2).split('.');
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `$${grouped}.${fraction}`;
}
