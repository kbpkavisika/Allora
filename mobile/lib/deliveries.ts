import type { BadgeVariant } from '@/components/ui/Badge';

export const deliveryStatuses = [
  'pending',
  'packed',
  'shipped',
  'delivered',
  'failed',
] as const;

export type DeliveryStatus = (typeof deliveryStatuses)[number];

export interface Delivery {
  id: string;
  order_id: string;
  status: DeliveryStatus;
  courier_name: string | null;
  tracking_number: string | null;
  estimated_at: string | null;
  delivered_at: string | null;
  created_at: string;
  updated_at: string;
}

interface DeliveryPresentation {
  label: string;
  variant: BadgeVariant;
}

const STATUS: Record<DeliveryStatus, DeliveryPresentation> = {
  pending: { label: 'Not dispatched', variant: 'neutral' },
  packed: { label: 'Packed', variant: 'neutral' },
  shipped: { label: 'Shipped', variant: 'dark' },
  delivered: { label: 'Delivered', variant: 'success' },
  failed: { label: 'Delivery failed', variant: 'warning' },
};

export function deliveryStatusPresentation(status: DeliveryStatus): DeliveryPresentation {
  return STATUS[status];
}

export const deliveryStatusLabels = deliveryStatuses.map((status) => STATUS[status].label);

const NEXT_STATUS: Partial<Record<DeliveryStatus, DeliveryStatus>> = {
  pending: 'packed',
  packed: 'shipped',
  shipped: 'delivered',
};

const NEXT_ACTION_LABEL: Partial<Record<DeliveryStatus, string>> = {
  pending: 'Mark as packed',
  packed: 'Mark as shipped',
  shipped: 'Mark as delivered',
};

export function nextDeliveryStatus(status: DeliveryStatus): DeliveryStatus | null {
  return NEXT_STATUS[status] ?? null;
}

export function nextDeliveryStatusLabel(status: DeliveryStatus): string | null {
  return NEXT_ACTION_LABEL[status] ?? null;
}

export function deliveryStatusFromLabel(label: string): DeliveryStatus {
  return deliveryStatuses.find((status) => STATUS[status].label === label) ?? 'pending';
}

export function deliveryCaption(delivery: Delivery | null): string | null {
  if (!delivery || delivery.status === 'pending') {
    return null;
  }

  return STATUS[delivery.status].label;
}

export function formatDeliveryDate(value: string): string {
  return new Date(value).toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}
