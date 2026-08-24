import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { Icon } from '@/components/ui/Icon';
import {
  formatPlacedAt,
  itemSummary,
  statusPresentation,
  trackingStep,
  type Order,
} from '@/lib/orders';

export interface OrderListCardProps {
  order: Order;
}

export function OrderListCard({ order }: OrderListCardProps) {
  const status = statusPresentation(order.status);
  const cover = order.items[0]?.product_photo;
  const caption =
    order.status === 'new'
      ? `${status.label} · Order placed ${formatPlacedAt(order.placed_at)}`
      : `${status.label} · ${trackingStep(order.status).label}`;

  return (
    <Pressable
      onPress={() => router.push({ pathname: '/orders/[id]', params: { id: order.id } })}
      role="button"
      aria-label={`Order ${order.order_number}, ${status.label}`}
      accessibilityHint="Opens the order"
      className="flex-row items-center gap-3 rounded-12 border-1 border-border bg-surface p-3 active:bg-surface-muted">
      <View className="h-14 w-14 items-center justify-center overflow-hidden rounded-8 bg-surface-sunken">
        {cover ? (
          <Image
            source={{ uri: cover }}
            style={{ width: '100%', height: '100%' }}
            contentFit="cover"
          />
        ) : (
          <Icon name="orders" size="md" className="text-secondary" />
        )}
      </View>

      <View className="flex-1 gap-1">
        <Text className="type-mono text-secondary" numberOfLines={1}>
          Order {order.order_number}
        </Text>
        <Text className="type-label-lg text-primary" numberOfLines={1}>
          {itemSummary(order.items)}
        </Text>

        {/* Status is a full sentence, never colour alone (design.md §06, wireframe S16). */}
        <View className="flex-row items-center gap-2">
          <View className={`h-2 w-2 rounded-full ${status.tone}`} />
          <Text className="type-text-secondary text-secondary" numberOfLines={1}>
            {caption}
          </Text>
        </View>
      </View>

      <Icon name="forward" size="md" className="text-secondary" />
    </Pressable>
  );
}
