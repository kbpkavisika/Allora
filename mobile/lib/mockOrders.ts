// Placeholder fixture data for the buyer order history UI until a backend exists.
// Mirrors the shape lib/mockProducts.ts uses for the seller product list.

export type OrderStatus = 'placed' | 'payment_received' | 'preparing' | 'out_for_delivery' | 'delivered';

export interface OrderLineItem {
  name: string;
  quantity: number;
  price: string;
}

export interface OrderTimelineStep {
  status: OrderStatus;
  label: string;
  timestamp: string | null;
}

export interface MockOrder {
  id: string;
  status: OrderStatus;
  placedAt: string;
  items: OrderLineItem[];
  total: string;
  deliveryNote: string;
  timeline: OrderTimelineStep[];
}

const STATUS_LABEL: Record<OrderStatus, string> = {
  placed: 'Order placed',
  payment_received: 'Payment received',
  preparing: 'Seller preparing your order',
  out_for_delivery: 'Out for delivery',
  delivered: 'Delivered',
};

export function statusLabel(status: OrderStatus): string {
  return STATUS_LABEL[status];
}

export const mockOrders: MockOrder[] = [
  {
    id: 'ALL-24187',
    status: 'preparing',
    placedAt: '2026-08-22',
    items: [{ name: 'Ridge Shell Jacket', quantity: 1, price: '128.00' }],
    total: '128.00',
    deliveryNote: 'Arriving in 2-3 days',
    timeline: [
      { status: 'placed', label: STATUS_LABEL.placed, timestamp: '22 Aug, 9:41 am' },
      { status: 'payment_received', label: STATUS_LABEL.payment_received, timestamp: '22 Aug, 9:42 am' },
      { status: 'preparing', label: STATUS_LABEL.preparing, timestamp: 'In progress since 22 Aug, 10:15 am' },
      { status: 'out_for_delivery', label: STATUS_LABEL.out_for_delivery, timestamp: null },
      { status: 'delivered', label: STATUS_LABEL.delivered, timestamp: null },
    ],
  },
  {
    id: 'ALL-24102',
    status: 'out_for_delivery',
    placedAt: '2026-08-20',
    items: [{ name: 'Nulu Everyday Leggings', quantity: 2, price: '99.00' }],
    total: '198.00',
    deliveryNote: 'Arriving today',
    timeline: [
      { status: 'placed', label: STATUS_LABEL.placed, timestamp: '20 Aug, 11:02 am' },
      { status: 'payment_received', label: STATUS_LABEL.payment_received, timestamp: '20 Aug, 11:03 am' },
      { status: 'preparing', label: STATUS_LABEL.preparing, timestamp: '20 Aug, 3:40 pm' },
      { status: 'out_for_delivery', label: STATUS_LABEL.out_for_delivery, timestamp: 'Since 8:00 am today' },
      { status: 'delivered', label: STATUS_LABEL.delivered, timestamp: null },
    ],
  },
  {
    id: 'ALL-23880',
    status: 'delivered',
    placedAt: '2026-08-14',
    items: [{ name: 'Trail Runner Low', quantity: 1, price: '145.00' }],
    total: '145.00',
    deliveryNote: '3 days ago',
    timeline: [
      { status: 'placed', label: STATUS_LABEL.placed, timestamp: '14 Aug, 8:12 am' },
      { status: 'payment_received', label: STATUS_LABEL.payment_received, timestamp: '14 Aug, 8:13 am' },
      { status: 'preparing', label: STATUS_LABEL.preparing, timestamp: '14 Aug, 1:00 pm' },
      { status: 'out_for_delivery', label: STATUS_LABEL.out_for_delivery, timestamp: '16 Aug, 9:00 am' },
      { status: 'delivered', label: STATUS_LABEL.delivered, timestamp: '17 Aug, 2:20 pm' },
    ],
  },
];
