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
  packed_at: string | null;
  shipped_at: string | null;
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

const ETA_WINDOWS: readonly { label: string; days: number | null }[] = [
  { label: 'No estimate', days: null },
  { label: '1-2 days', days: 2 },
  { label: '3-5 days', days: 5 },
  { label: 'About a week', days: 7 },
];

export const etaWindowLabels = ETA_WINDOWS.map((window) => window.label);

export function etaFromWindow(label: string): string | null {
  const days = ETA_WINDOWS.find((window) => window.label === label)?.days ?? null;
  if (days === null) {
    return null;
  }

  const estimate = new Date();
  estimate.setDate(estimate.getDate() + days);
  return estimate.toISOString();
}

export function etaWindowFromDate(estimatedAt: string | null): string {
  if (!estimatedAt) {
    return ETA_WINDOWS[0].label;
  }

  const daysAway = Math.ceil(
    (new Date(estimatedAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  const match = ETA_WINDOWS.find((window) => window.days !== null && window.days >= daysAway);
  return (match ?? ETA_WINDOWS[ETA_WINDOWS.length - 1]).label;
}

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

interface DeliveryTrackingStep {
  current: number;
  total: number;
  label: string;
}

const TRACKING: Record<DeliveryStatus, DeliveryTrackingStep> = {
  pending: { current: 1, total: 4, label: 'Order placed' },
  packed: { current: 2, total: 4, label: 'Packed by the seller' },
  shipped: { current: 3, total: 4, label: 'On the way to you' },
  delivered: { current: 4, total: 4, label: 'Delivered' },
  failed: { current: 3, total: 4, label: 'Delivery could not be completed' },
};

export function deliveryTrackingStep(delivery: Delivery | null): DeliveryTrackingStep {
  return TRACKING[delivery?.status ?? 'pending'];
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
