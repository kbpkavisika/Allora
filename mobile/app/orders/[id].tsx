import { router, useLocalSearchParams } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Callout } from '@/components/ui/Callout';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { StepProgress } from '@/components/ui/StepProgress';
import { SuccessBanner } from '@/components/ui/SuccessBanner';
import { TopBar } from '@/components/ui/TopBar';
import {
  formatMoney,
  statusPresentation,
  trackingStep,
  type OrderItem,
} from '@/lib/orders';
import { useOrders } from '@/lib/OrdersProvider';

export default function OrderDetailScreen() {
  const insets = useSafeAreaInsets();
  const { id, returned } = useLocalSearchParams<{ id?: string; returned?: string }>();
  const { getOrder, isLoading } = useOrders();

  const order = id ? getOrder(id) : undefined;

  if (!order) {
    return (
      <View className="flex-1 bg-surface">
        <TopBar title="Order" />
        <View className="items-center gap-3 p-4 pt-16">
          <Text role="heading" className="type-h3 text-primary">
            {isLoading ? 'Loading order…' : 'Order not found'}
          </Text>
          {!isLoading ? (
            <Button
              variant="secondary"
              label="Back to orders"
              fullWidth={false}
              onPress={() => router.replace('/(tabs)/orders')}
            />
          ) : null}
        </View>
      </View>
    );
  }

  const presentation = statusPresentation(order.status);
  const step = trackingStep(order.status);
  const total = order.items.reduce((sum, item) => sum + item.unit_price * item.quantity, 0);

  return (
    <View className="flex-1 bg-surface">
      <TopBar title={`Order ${order.order_number}`} />

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 32, gap: 24 }}
        showsVerticalScrollIndicator={false}>
        {returned ? (
          <SuccessBanner message="Return request sent. The seller will be in touch." />
        ) : null}

        <View className="gap-2">
          <Badge label={presentation.label} variant={presentation.variant} />
          <Text role="heading" className="type-h2 text-primary">
            {order.items[0]?.product_name ?? 'Order'}
          </Text>
          <Text className="type-text-secondary text-secondary">
            Placed {new Date(order.placed_at).toLocaleDateString('en-US', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}
          </Text>
        </View>

        <View className="gap-4">
          <SectionHeader title="Tracking" />
          <StepProgress current={step.current} total={step.total} />
          <Text className="type-text-secondary text-secondary">
            Step {step.current} of {step.total} · {step.label}
          </Text>
        </View>

        <View className="gap-4">
          <SectionHeader title="Items" />
          <View className="rounded-12 border-1 border-border bg-surface px-4">
            {order.items.map((item: OrderItem, index) => (
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
          <View className="flex-row items-center justify-between px-1">
            <Text className="type-label-lg text-primary">Total</Text>
            <Text className="type-label-lg text-primary">{formatMoney(total)}</Text>
          </View>
        </View>

        <Callout message="You'll get a visual and vibration alert on every status change." />

        <View className="flex-row gap-3">
          <View className="flex-1">
            <Button
              variant="secondary"
              size="sm"
              label="Return item"
              onPress={() =>
                router.push({ pathname: '/orders/[id]/return', params: { id: order.id } })
              }
            />
          </View>
          <View className="flex-1">
            <Button variant="secondary" size="sm" label="Contact seller" disabled />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
