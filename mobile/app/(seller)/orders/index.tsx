import { Text, View } from 'react-native';

import { Icon } from '@/components/ui/Icon';

export default function SellerOrdersScreen() {
  return (
    <View className="flex-1 items-center justify-center gap-3 bg-surface px-8">
      <Icon name="orders" size="lg" className="text-secondary" />
      <Text role="heading" className="type-h3 text-primary">
        No orders yet
      </Text>
      <Text className="type-text-primary text-center text-secondary">
        Orders placed for your products will show up here.
      </Text>
    </View>
  );
}
