import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';

import { Badge, type BadgeVariant } from '@/components/ui/Badge';
import { Icon } from '@/components/ui/Icon';
import { ProductThumbnail } from '@/components/ui/ProductThumbnail';
import { deliveryCaption } from '@/lib/deliveries';
import {
  formatMoney,
  formatPlacedAt,
  itemSummary,
  orderItemPhoto,
  statusPresentation,
  type Order,
} from '@/lib/orders';
import { refundService } from '@/services/refund/refundService';

export interface OrderListCardProps {
  order: Order;
  position?: string;
}

function getOrderPaymentBadge(order: Order): { label: string; variant: BadgeVariant; voice: string } {
  const refund = refundService.getRefund(order.id);
  if (refund) {
    if (refund.status === 'refunded') {
      return { label: 'Refund Completed', variant: 'success', voice: 'Refund completed' };
    }
    if (refund.status === 'failed') {
      return { label: 'Refund Failed', variant: 'warning', voice: 'Refund failed' };
    }
    return { label: 'Refund Processing', variant: 'neutral', voice: 'Refund processing' };
  }

  if (order.payment_status === 'refunded') {
    return { label: 'Refund Completed', variant: 'success', voice: 'Refund completed' };
  }

  if (order.payment_status === 'partially_refunded') {
    return { label: 'Partially Refunded', variant: 'neutral', voice: 'Order partially refunded' };
  }

  if (order.status === ('cancelled' as any) || (order as any).cancelled_at) {
    return { label: 'Cancelled', variant: 'neutral', voice: 'Order cancelled' };
  }

  if (order.payment_status === 'failed') {
    return { label: 'Payment Failed', variant: 'warning', voice: 'Payment failed' };
  }

  if (
    order.payment_status === 'paid' ||
    (order.status === 'completed' && order.payment_method === 'payhere')
  ) {
    return { label: 'Paid', variant: 'success', voice: 'Payment paid' };
  }

  if (order.payment_method === 'cod') {
    return { label: 'Due on Delivery', variant: 'neutral', voice: 'Payment due on delivery' };
  }

  return { label: 'Pending', variant: 'neutral', voice: 'Payment pending' };
}

export function OrderListCard({ order, position }: OrderListCardProps) {
  const { t } = useTranslation();
  const status = statusPresentation(order.status);
  const cover = orderItemPhoto(order.items[0]);
  const delivery = deliveryCaption(order.delivery);
  const caption = `${status.label} · ${
    delivery ?? t('orders.placedCaption', { date: formatPlacedAt(order.placed_at) })
  }`;
  const paymentBadge = getOrderPaymentBadge(order);

  return (
    <Pressable
      onPress={() => router.push({ pathname: '/orders/[id]', params: { id: order.id } })}
      role="button"
      aria-label={`${t('orders.orderNumber', { number: order.order_number })}, ${itemSummary(order.items)}, ${formatMoney(order.total)}, Status: ${status.label}, Payment: ${paymentBadge.voice}${position ? `, ${position}` : ''}`}
      accessibilityHint={t('orders.openHint')}
      className="flex-row items-center gap-3 rounded-12 border-1 border-border bg-surface p-3 active:bg-surface-muted">
      <ProductThumbnail uri={cover} fallbackIcon="orders" />

      <View className="flex-1 gap-1">
        <View className="flex-row items-center justify-between gap-2">
          <Text className="type-mono text-secondary" numberOfLines={1}>
            {t('orders.orderNumber', { number: order.order_number })}
          </Text>
          <Badge label={paymentBadge.label} variant={paymentBadge.variant} />
        </View>

        <Text className="type-label-lg text-primary" numberOfLines={1}>
          {itemSummary(order.items)}
        </Text>

        {/* Status is a full sentence, never colour alone (design.md §06, wireframe S16). */}
        <View className="flex-row items-center justify-between gap-2">
          <View className="flex-1 flex-row items-center gap-2">
            <View className={`h-2 w-2 rounded-full ${status.tone}`} />
            <Text className="type-text-secondary text-secondary" numberOfLines={1}>
              {caption}
            </Text>
          </View>
          <Text className="type-label text-primary">
            {formatMoney(order.total)}
          </Text>
        </View>
      </View>

      <Icon name="forward" size="md" className="text-secondary" />
    </Pressable>
  );
}
