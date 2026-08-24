import { router, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import { Text, View } from 'react-native';

import { OrderStatusTimeline } from '@/components/orders/OrderStatusTimeline';
import { KeyboardScreen } from '@/components/ui/KeyboardScreen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { mockOrders } from '@/lib/mockOrders';

export default function OrderTrackingScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const order = mockOrders.find((item) => item.id === id);

  useEffect(() => {
    if (!order) {
      router.replace('/(tabs)/orders/index');
    }
  }, [order]);

  if (!order) {
    return null;
  }

  return (
    <KeyboardScreen>
      <View className="flex-1 gap-8">
        <ScreenHeader title={order.id} />

        <View className="gap-2 rounded-12 border-1 border-border bg-surface p-4">
          {order.items.map((item) => (
            <Text key={item.name} className="type-text-primary text-primary">
              {item.name} × {item.quantity} · ${item.price}
            </Text>
          ))}
          <Text className="type-label-lg mt-2 text-primary">Total: ${order.total}</Text>
          <Text className="type-text-secondary text-secondary">{order.deliveryNote}</Text>
        </View>

        <View className="gap-4">
          <Text className="type-h3 text-primary">Tracking</Text>
          <OrderStatusTimeline timeline={order.timeline} />
        </View>
      </View>
    </KeyboardScreen>
  );
}
