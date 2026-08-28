import { useLocalSearchParams } from 'expo-router';
import { Text, View } from 'react-native';

import { TopBar } from '@/components/ui/TopBar';
import { mockSellerOrders } from '@/lib/mockSellerOrders';

export default function SellerOrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const order = mockSellerOrders.find((item) => item.id === id);

  return (
    <View className="flex-1 bg-surface">
      <TopBar title={order ? `Order ${order.order_number}` : 'Order'} />
      <View className="p-4">
        <Text className="type-text-primary text-secondary">Order details are wired next.</Text>
      </View>
    </View>
  );
}
