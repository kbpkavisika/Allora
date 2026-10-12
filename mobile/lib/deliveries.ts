import type { BadgeVariant } from '@/components/ui/Badge';
import i18n, { formatDate } from '@/lib/i18n';

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

const VARIANT: Record<DeliveryStatus, BadgeVariant> = {
  pending: 'neutral',
  packed: 'neutral',
  shipped: 'dark',
  delivered: 'success',
  failed: 'warning',
};

export function deliveryStatusLabel(status: string): string {
  return i18n.t(`deliveries.status.${status}`);
}

export function deliveryStatusPresentation(status: DeliveryStatus): DeliveryPresentation {
  return { label: deliveryStatusLabel(status), variant: VARIANT[status] };
}

const NEXT_STATUS: Partial<Record<DeliveryStatus, DeliveryStatus>> = {
  pending: 'packed',
  packed: 'shipped',
  shipped: 'delivered',
};

export function nextDeliveryStatus(status: DeliveryStatus): DeliveryStatus | null {
  return NEXT_STATUS[status] ?? null;
}

export function nextDeliveryStatusLabel(status: DeliveryStatus): string | null {
  const next = NEXT_STATUS[status];
  return next ? i18n.t(`deliveries.markAs.${next}`) : null;
}

interface DeliveryTrackingStep {
  current: number;
  total: number;
  label: string;
}

const TRACKING_STEP: Record<DeliveryStatus, number> = {
  pending: 1,
  packed: 2,
  shipped: 3,
  delivered: 4,
  failed: 3,
};

export function deliveryTrackingStep(delivery: Delivery | null): DeliveryTrackingStep {
  const status = delivery?.status ?? 'pending';
  return {
    current: TRACKING_STEP[status],
    total: 4,
    label: i18n.t(`deliveries.tracking.${status}`),
  };
}

export function deliveryCaption(delivery: Delivery | null): string | null {
  if (!delivery || delivery.status === 'pending') {
    return null;
  }

  return deliveryStatusLabel(delivery.status);
}

export function formatDeliveryDate(value: string): string {
  return formatDate(value, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}
