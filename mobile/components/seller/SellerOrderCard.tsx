import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';

import { Badge } from '@/components/ui/Badge';
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

export interface SellerOrderCardProps {
  order: Order;
  onPress: () => void;
  onAdvance: () => void;
  isAdvancing?: boolean;
  position?: string;
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
  const advanceLabel =
    order.status === 'cancelled'
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
        aria-label={`${orderNumber}, ${buyer}, ${status.label}${position ? `, ${position}` : ''}`}
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
