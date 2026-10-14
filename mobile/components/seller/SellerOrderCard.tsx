import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';

import { Badge, type BadgeVariant } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { ProductThumbnail } from '@/components/ui/ProductThumbnail';
import { deliveryCaption, nextDeliveryStatusLabel } from '@/lib/deliveries';
import {
  formatPlacedAt,
  hasOpenReturn,
  itemSummary,
  latestReturn,
  orderItemPhoto,
  returnStatusPresentation,
  statusPresentation,
  type Order,
} from '@/lib/orders';
import { refundService } from '@/services/refund/refundService';

export interface SellerOrderCardProps {
  order: Order;
  onPress: () => void;
  onAdvance: () => void;
  isAdvancing?: boolean;
  position?: string;
}

function getSellerRefundBadge(
  order: Order
): { label: string; variant: BadgeVariant; voice: string } | null {
  const refund = refundService.getRefund(order.id);
  if (refund) {
    if (refund.status === 'refunded') {
      return { label: 'Refund Completed', variant: 'success', voice: 'Refund completed' };
    }
    if (refund.status === 'failed') {
      return { label: 'Refund Failed', variant: 'warning', voice: 'Refund failed' };
    }
    if (refund.status === 'requested') {
      return { label: 'Refund Requested', variant: 'neutral', voice: 'Refund requested' };
    }
    return { label: 'Refund Processing', variant: 'neutral', voice: 'Refund processing' };
  }

  if (order.payment_status === 'refunded') {
    return { label: 'Refund Completed', variant: 'success', voice: 'Refund completed' };
  }

  if (order.payment_status === 'partially_refunded') {
    return { label: 'Partially Refunded', variant: 'neutral', voice: 'Partially refunded' };
  }

  return null;
}

export function SellerOrderCard({
  order,
  onPress,
  onAdvance,
  isAdvancing = false,
  position,
}: SellerOrderCardProps) {
  const { t } = useTranslation();
  const status = statusPresentation(order.status);
  const refundBadge = getSellerRefundBadge(order);
  const isRefunded =
    order.payment_status === 'refunded' || refundBadge?.label === 'Refund Completed';
  const advanceLabel =
    order.status === 'cancelled' || isRefunded
      ? null
      : nextDeliveryStatusLabel(order.delivery?.status ?? 'pending');
  const delivery = deliveryCaption(order.delivery);
  const orderNumber = t('orders.orderNumber', { number: order.order_number });
  const buyer = order.ship_name ?? t('account.seller.buyer');
  const openReturn = hasOpenReturn(order) ? latestReturn(order) : undefined;

  return (
    <View className="gap-3 rounded-12 border-1 border-border bg-surface p-3">
      <Pressable
        onPress={onPress}
        role="button"
        aria-label={`${orderNumber}, ${buyer}, ${status.label}${refundBadge ? `, ${refundBadge.voice}` : ''}${openReturn ? `, Return ${openReturn.status}` : ''}${position ? `, ${position}` : ''}`}
        accessibilityHint={t('seller.orders.openHint')}
        className="flex-row items-center gap-3 active:bg-surface-muted">
        <ProductThumbnail uri={orderItemPhoto(order.items[0])} fallbackIcon="orders" />

        <View className="flex-1 gap-1">
          <Text className="type-mono text-secondary" numberOfLines={1}>
            {orderNumber}
          </Text>
          <Text
            className="type-label-lg text-primary"
            numberOfLines={1}
            maxFontSizeMultiplier={1.5}>
            {buyer}
          </Text>
          <Text className="type-text-secondary text-secondary" numberOfLines={1}>
            {itemSummary(order.items)}
          </Text>

          <View className="flex-row items-center gap-2">
            <View className={`h-2 w-2 rounded-full ${status.tone}`} />
            <Text className="type-text-secondary text-secondary" numberOfLines={1}>
              {status.label} · {delivery ?? formatPlacedAt(order.placed_at)}
            </Text>
          </View>

          {openReturn ? (
            <Badge
              label={returnStatusPresentation(openReturn.status).label}
              variant={returnStatusPresentation(openReturn.status).variant}
            />
          ) : null}

          {refundBadge ? (
            <Badge label={refundBadge.label} variant={refundBadge.variant} />
          ) : null}
        </View>

        <Icon name="forward" size="md" className="text-secondary" />
      </Pressable>

      {advanceLabel ? (
        <Button
          variant="secondary"
          size="sm"
          label={advanceLabel}
          loading={isAdvancing}
          fullWidth={false}
          onPress={onAdvance}
        />
      ) : null}
    </View>
  );
}
