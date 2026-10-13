import { useTranslation } from 'react-i18next';

import { Callout } from '@/components/ui/Callout';
import { formatDate } from '@/lib/i18n';
import type { Order } from '@/lib/orders';

export interface OrderCancellationNoticeProps {
  order: Order;
  viewer: 'buyer' | 'seller';
}

export function OrderCancellationNotice({ order, viewer }: OrderCancellationNoticeProps) {
  const { t } = useTranslation();

  if (order.status !== 'cancelled' || !order.cancelled_at) return null;

  const date = formatDate(order.cancelled_at, { day: 'numeric', month: 'short', year: 'numeric' });
  const who =
    order.cancelled_by === viewer
      ? t('orders.cancel.cancelledByYou', { date })
      : order.cancelled_by === 'seller'
        ? t('orders.cancel.cancelledBySeller', { date })
        : t('orders.cancel.cancelledByBuyer', { date });

  const message = order.cancel_reason
    ? `${who} ${t('orders.cancel.reasonLine', { reason: order.cancel_reason })}`
    : who;

  return <Callout tone="warning" message={message} />;
}
