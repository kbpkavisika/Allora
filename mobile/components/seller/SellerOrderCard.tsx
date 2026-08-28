import { Pressable, Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import {
  formatPlacedAt,
  itemSummary,
  nextStatusLabel,
  statusPresentation,
  type SellerOrder,
} from '@/lib/orders';

export interface SellerOrderCardProps {
  order: SellerOrder;
  onPress: () => void;
  onAdvance: () => void;
  isAdvancing?: boolean;
}

export function SellerOrderCard({
  order,
  onPress,
  onAdvance,
  isAdvancing = false,
}: SellerOrderCardProps) {
  const status = statusPresentation(order.status);
  const advanceLabel = nextStatusLabel(order.status);

  return (
    <View className="gap-3 rounded-12 border-1 border-border bg-surface p-3">
      <Pressable
        onPress={onPress}
        role="button"
        aria-label={`Order ${order.order_number}, ${order.buyer_name}, ${status.label}`}
        accessibilityHint="Opens the order details"
        className="flex-row items-center gap-3 active:bg-surface-muted">
        <View className="h-14 w-14 items-center justify-center rounded-8 bg-surface-sunken">
          <Icon name="orders" size="md" className="text-secondary" />
        </View>

        <View className="flex-1 gap-1">
          <Text className="type-mono text-secondary" numberOfLines={1}>
            Order {order.order_number}
          </Text>
          <Text
            className="type-label-lg text-primary"
            numberOfLines={1}
            maxFontSizeMultiplier={1.5}>
            {order.buyer_name}
          </Text>
          <Text className="type-text-secondary text-secondary" numberOfLines={1}>
            {itemSummary(order.items)}
          </Text>

          <View className="flex-row items-center gap-2">
            <View className={`h-2 w-2 rounded-full ${status.tone}`} />
            <Text className="type-text-secondary text-secondary" numberOfLines={1}>
              {status.label} · {formatPlacedAt(order.placed_at)}
            </Text>
          </View>
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
