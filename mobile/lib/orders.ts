import type { BadgeVariant } from '@/components/ui/Badge';
import type { Delivery } from '@/lib/deliveries';
import i18n, { formatDate } from '@/lib/i18n';

export const orderStatuses = ['new', 'processing', 'completed'] as const;

export type OrderStatus = (typeof orderStatuses)[number];

export type PaymentMethod = 'payhere' | 'cod';
export type PaymentStatus =
  | 'pending'
  | 'paid'
  | 'failed'
  | 'refunded'
  | 'partially_refunded';


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
  delivery: Delivery | null;
}

// Kept as aliases so the seller screens that imported the old names keep compiling.
export type SellerOrder = Order;
export type SellerOrderItem = OrderItem;

export const returnReasons = ['damaged', 'wrong_item', 'changed_mind', 'other'] as const;

export type ReturnReason = (typeof returnReasons)[number];

export function returnReasonLabel(reason: string): string {
  return i18n.t(`orders.returnReason.${reason}`);
}

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

const STATUS: Record<OrderStatus, Omit<StatusPresentation, 'label'>> = {
  new: { tone: 'bg-accent', variant: 'warning' },
  processing: { tone: 'bg-info', variant: 'neutral' },
  completed: { tone: 'bg-success', variant: 'success' },
};

export function statusPresentation(status: OrderStatus): StatusPresentation {
  return { ...STATUS[status], label: i18n.t(`orders.status.${status}`) };
}

export function itemSummary(items: OrderItem[]): string {
  const [first, ...rest] = items;

  if (!first) {
    return i18n.t('orders.noItems');
  }

  const restCount = rest.reduce((sum, item) => sum + item.quantity, 0);
  return restCount > 0
    ? i18n.t('orders.itemSummary', { name: first.product_name, count: restCount })
    : first.product_name;
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

  return isToday ? i18n.t('orders.today') : formatDate(placed, { month: 'short', day: 'numeric' });
}

export function formatMoney(amount: number): string {
  const [whole, fraction] = Number(amount).toFixed(2).split('.');
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `$${grouped}.${fraction}`;
}
