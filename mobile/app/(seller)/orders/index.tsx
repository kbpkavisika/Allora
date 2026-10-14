import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, FlatList, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SellerOrderCard } from '@/components/seller/SellerOrderCard';
import { Icon } from '@/components/ui/Icon';
import { ScrollTabs, type ScrollTabItem } from '@/components/ui/ScrollTabs';
import { TopBar } from '@/components/ui/TopBar';
import { useListPosition } from '@/hooks/useListPosition';
import { useOrdersRefresh } from '@/hooks/useOrdersRefresh';
import { orderStatuses, type OrderStatus } from '@/lib/orders';
import { useOrders } from '@/lib/OrdersProvider';
import { refundService } from '@/services/refund/refundService';

export default function SellerOrdersScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { orders, isLoading, advanceDelivery } = useOrders();
  const { isRefreshing, pullToRefresh } = useOrdersRefresh();
  const positionOf = useListPosition();

  const [tab, setTab] = useState<OrderStatus>('new');
  const [advancingId, setAdvancingId] = useState<string | null>(null);
  const [, setRefundRefreshCount] = useState(0);

  useEffect(() => {
    if (orders.length > 0) {
      const orderIds = orders.map((o) => o.id);
      void refundService.fetchRefundsForOrders(orderIds).then(() => {
        setRefundRefreshCount((count) => count + 1);
      });
    }
  }, [orders]);

  const tabs = useMemo<ScrollTabItem[]>(
    () =>
      orderStatuses.map((status) => ({
        value: status,
        label: t(`orders.status.${status}`),
        count: orders.filter((order) => order.status === status).length,
      })),
    [orders, t]
  );

  const visibleOrders = useMemo(
    () => orders.filter((order) => order.status === tab),
    [orders, tab]
  );

  async function advance(orderId: string) {
    setAdvancingId(orderId);
    await advanceDelivery(orderId);
    setAdvancingId(null);
  }

  return (
    <View className="flex-1 bg-surface">
      <TopBar title={t('tabs.orders')} showBack={false} />

      <ScrollTabs
        tabs={tabs}
        value={tab}
        onChange={(next) => setTab(next as OrderStatus)}
        label={t('seller.orders.filter')}
      />

      <FlatList
        data={visibleOrders}
        keyExtractor={(item) => item.id}
        refreshing={isRefreshing}
        onRefresh={pullToRefresh}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 16,
          paddingBottom: insets.bottom + 32,
          gap: 12,
        }}
        renderItem={({ item, index }) => (
          <SellerOrderCard
            order={item}
            position={positionOf(index, visibleOrders.length)}
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
                {t(`seller.orders.emptyTitle.${tab}`)}
              </Text>
              <Text className="type-text-primary text-center text-secondary">
                {t(`seller.orders.emptyBody.${tab}`)}
              </Text>
            </View>
          )
        }
      />
    </View>
  );
}
