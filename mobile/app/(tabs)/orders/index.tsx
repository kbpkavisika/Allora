import { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { OrderListCard } from '@/components/orders/OrderListCard';
import { ScrollTabs, type ScrollTabItem } from '@/components/ui/ScrollTabs';
import { useOrders } from '@/lib/OrdersProvider';

type OrderFilter = 'active' | 'past';

const isActive = (status: string) => status === 'new' || status === 'processing';

export default function OrdersScreen() {
  const insets = useSafeAreaInsets();
  const { orders, isLoading } = useOrders();
  const [filter, setFilter] = useState<OrderFilter>('active');

  const activeCount = orders.filter((order) => isActive(order.status)).length;
  const pastCount = orders.length - activeCount;

  const visibleOrders = useMemo(
    () =>
      orders.filter((order) =>
        filter === 'active' ? isActive(order.status) : !isActive(order.status)
      ),
    [orders, filter]
  );

  const tabs: ScrollTabItem[] = [
    { value: 'active', label: 'Active', count: activeCount },
    { value: 'past', label: 'Past', count: pastCount },
  ];

  return (
    <View className="flex-1 bg-surface">
      <View className="px-4 pb-2 pt-4">
        <Text role="heading" className="type-h1 text-primary" maxFontSizeMultiplier={1.5}>
          Orders
        </Text>
      </View>

      <ScrollTabs
        tabs={tabs}
        value={filter}
        onChange={(next) => setFilter(next as OrderFilter)}
        label="Filter orders"
      />

      <FlatList
        data={visibleOrders}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 16,
          paddingBottom: insets.bottom + 32,
          gap: 12,
        }}
        renderItem={({ item }) => <OrderListCard order={item} />}
        ListEmptyComponent={
          isLoading ? (
            <ActivityIndicator className="mt-16 text-secondary" />
          ) : (
            <Text className="type-text-primary mt-16 text-center text-secondary">
              {filter === 'active' ? 'No active orders right now.' : 'No past orders yet.'}
            </Text>
          )
        }
      />
    </View>
  );
}
