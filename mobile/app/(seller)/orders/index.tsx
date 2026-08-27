import { FlatList, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { OrderListCard } from '@/components/orders/OrderListCard';
import { Icon } from '@/components/ui/Icon';
import { mockOrders } from '@/lib/mockOrders';

export default function SellerOrdersScreen() {
  const insets = useSafeAreaInsets();

  const currentOrders = mockOrders.filter((order) => order.status !== 'delivered');

  return (
    <View className="flex-1 bg-surface">
      <FlatList
        data={currentOrders}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 16,
          paddingBottom: insets.bottom + 32,
          gap: 12,
        }}
        ListHeaderComponent={
          <View className="mb-6 gap-1">
            <Text role="heading" className="type-h1 text-primary" maxFontSizeMultiplier={1.5}>
              Orders
            </Text>
            <Text className="type-text-secondary text-secondary">
              {currentOrders.length} in progress
            </Text>
          </View>
        }
        renderItem={({ item }) => <OrderListCard order={item} />}
        ListEmptyComponent={
          <View className="items-center gap-3 pt-16">
            <Icon name="orders" size="lg" className="text-secondary" />
            <Text role="heading" className="type-h3 text-primary">
              No orders in progress
            </Text>
            <Text className="type-text-primary text-center text-secondary">
              Orders placed for your products will show up here.
            </Text>
          </View>
        }
      />
    </View>
  );
}
