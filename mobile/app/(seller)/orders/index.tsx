import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SellerOrderCard } from '@/components/seller/SellerOrderCard';
import { Icon } from '@/components/ui/Icon';
import { ScrollTabs, type ScrollTabItem } from '@/components/ui/ScrollTabs';
import { TopBar } from '@/components/ui/TopBar';
import { orderStatuses, type OrderStatus } from '@/lib/orders';
import { useOrders } from '@/lib/OrdersProvider';

const TAB_LABEL: Record<OrderStatus, string> = {
  new: 'New',
  processing: 'Processing',
  completed: 'Completed',
};

const EMPTY_MESSAGE: Record<OrderStatus, string> = {
  new: 'New orders from buyers will show up here.',
  processing: 'Orders you have started preparing will show up here.',
  completed: 'Orders you have finished will show up here.',
};

export default function SellerOrdersScreen() {
  const insets = useSafeAreaInsets();
  const { orders, isLoading, advanceStatus } = useOrders();

  const [tab, setTab] = useState<OrderStatus>('new');
  const [advancingId, setAdvancingId] = useState<string | null>(null);

  const tabs = useMemo<ScrollTabItem[]>(
    () =>
      orderStatuses.map((status) => ({
        value: status,
        label: TAB_LABEL[status],
        count: orders.filter((order) => order.status === status).length,
      })),
    [orders]
  );

  const visibleOrders = useMemo(
    () => orders.filter((order) => order.status === tab),
    [orders, tab]
  );

  async function advance(orderId: string) {
    setAdvancingId(orderId);
    await advanceStatus(orderId);
    setAdvancingId(null);
  }

  return (
    <View className="flex-1 bg-surface">
      <TopBar title="Orders" showBack={false} />

      <ScrollTabs
        tabs={tabs}
        value={tab}
        onChange={(next) => setTab(next as OrderStatus)}
        label="Filter orders by status"
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
        renderItem={({ item }) => (
          <SellerOrderCard
            order={item}
            isAdvancing={advancingId === item.id}
            onPress={() =>
              router.push({ pathname: '/seller/orders/[id]', params: { id: item.id } })
            }
            onAdvance={() => advance(item.id)}
          />
        )}
        ListEmptyComponent={
          isLoading ? (
            <ActivityIndicator className="mt-16 text-secondary" />
          ) : (
            <View className="items-center gap-3 pt-16">
              <Icon name="orders" size="lg" className="text-secondary" />
              <Text role="heading" className="type-h3 text-primary">
                No {TAB_LABEL[tab].toLowerCase()} orders
              </Text>
              <Text className="type-text-primary text-center text-secondary">
                {EMPTY_MESSAGE[tab]}
              </Text>
            </View>
          )
        }
      />
    </View>
  );
}
