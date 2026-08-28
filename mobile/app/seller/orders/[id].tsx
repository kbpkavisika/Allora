import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { TopBar } from '@/components/ui/TopBar';
import {
  formatMoney,
  formatPlacedAt,
  nextStatusLabel,
  statusPresentation,
} from '@/lib/orders';
import { useOrders } from '@/lib/OrdersProvider';

export default function SellerOrderDetailScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { getOrder, advanceStatus } = useOrders();

  const order = id ? getOrder(id) : undefined;
  const [isAdvancing, setIsAdvancing] = useState(false);

  if (!order) {
    return (
      <View className="flex-1 bg-surface">
        <TopBar title="Order" />
        <View className="items-center gap-3 p-4 pt-16">
          <Text role="heading" className="type-h3 text-primary">
            Order not found
          </Text>
          <Text className="type-text-primary text-center text-secondary">
            This order is no longer available.
          </Text>
          <Button
            variant="secondary"
            label="Back to orders"
            fullWidth={false}
            onPress={() => router.replace('/(seller)/orders')}
          />
        </View>
      </View>
    );
  }

  const presentation = statusPresentation(order.status);
  const advanceLabel = nextStatusLabel(order.status);
  const itemsTotal = order.items.reduce(
    (sum, item) => sum + item.unit_price * item.quantity,
    0
  );

  async function advance() {
    setIsAdvancing(true);
    await advanceStatus(order!.id);
    setIsAdvancing(false);
  }

  return (
    <View className="flex-1 bg-surface">
      <TopBar title={`Order ${order.order_number}`} />

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 32, gap: 24 }}>
        <View className="gap-2">
          <Badge label={presentation.label} variant={presentation.variant} />
          <Text className="type-h2 text-primary">{order.ship_name ?? 'Buyer'}</Text>
          <Text className="type-text-secondary text-secondary">
            Placed {formatPlacedAt(order.placed_at)}
          </Text>
        </View>

        <View className="gap-4">
          <SectionHeader title="Items" />

          <View className="rounded-12 border-1 border-border bg-surface px-4">
            {order.items.map((item, index) => (
              <View
                key={item.id}
                className={`min-h-tap flex-row items-center gap-3 py-3 ${
                  index < order.items.length - 1 ? 'border-b-1 border-border' : ''
                }`}>
                <View className="flex-1 gap-0.5">
                  <Text className="type-label-lg text-primary" numberOfLines={2}>
                    {item.product_name}
                  </Text>
                  <Text className="type-text-secondary text-secondary">
                    {formatMoney(item.unit_price)} × {item.quantity}
                  </Text>
                </View>

                <Text className="type-text-primary text-primary">
                  {formatMoney(item.unit_price * item.quantity)}
                </Text>
              </View>
            ))}
          </View>

          <View className="flex-row items-center justify-between gap-3 px-4">
            <Text className="type-label-lg text-primary">Total</Text>
            <Text className="type-label-lg text-primary">{formatMoney(itemsTotal)}</Text>
          </View>
        </View>

        {advanceLabel ? (
          <Button label={advanceLabel} loading={isAdvancing} onPress={advance} />
        ) : (
          <Text className="type-text-secondary text-center text-secondary">
            This order is complete.
          </Text>
        )}
      </ScrollView>
    </View>
  );
}
