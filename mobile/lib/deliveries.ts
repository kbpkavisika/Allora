import type { BadgeVariant } from '@/components/ui/Badge';

export const deliveryStatuses = ['pending', 'in_transit', 'delivered', 'failed'] as const;

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
  in_transit: { label: 'In transit', variant: 'dark' },
  delivered: { label: 'Delivered', variant: 'success' },
  failed: { label: 'Delivery failed', variant: 'warning' },
};

export function deliveryStatusPresentation(status: DeliveryStatus): DeliveryPresentation {
  return STATUS[status];
}

export const deliveryStatusLabels = deliveryStatuses.map((status) => STATUS[status].label);

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
