import { router } from 'expo-router';
import { Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { statusLabel, type MockOrder } from '@/lib/mockOrders';

export interface OrderListCardProps {
  order: MockOrder;
}

const STATUS_COLOR: Record<MockOrder['status'], string> = {
  placed: 'text-secondary',
  payment_received: 'text-secondary',
  preparing: 'text-primary',
  out_for_delivery: 'text-info',
  delivered: 'text-success',
};

function itemSummary(order: MockOrder): string {
  const [first, ...rest] = order.items;
  const restCount = rest.reduce((sum, item) => sum + item.quantity, 0);
  return restCount > 0 ? `${first.name} and ${restCount} more` : first.name;
}

export function OrderListCard({ order }: OrderListCardProps) {
  return (
    <View className="gap-2 rounded-12 border-1 border-border bg-surface p-3">
      <Text className="type-label-lg text-primary" numberOfLines={1}>
        {order.id} · {itemSummary(order)}
      </Text>

      {/* Status is a full sentence, never colour alone (wireframe S16 note: T10 found a
          coloured pill was hard to find). */}
      <Text className={`type-text-primary ${STATUS_COLOR[order.status]}`}>
        {statusLabel(order.status)} · {order.deliveryNote}
      </Text>

      <Text className="type-text-secondary text-secondary">
        Placed {order.placedAt} · ${order.total}
      </Text>

      <Button
        variant="secondary"
        size="sm"
        label="View details"
        fullWidth={false}
        className="mt-1"
        onPress={() => router.push({ pathname: '/orders/[id]', params: { id: order.id } })}
      />
    </View>
  );
}
