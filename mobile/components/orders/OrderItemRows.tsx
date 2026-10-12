import { Text, View } from 'react-native';

import { ProductThumbnail } from '@/components/ui/ProductThumbnail';
import { formatMoney, orderItemPhoto, type OrderItem } from '@/lib/orders';

export interface OrderItemRowsProps {
  items: OrderItem[];
}

export function OrderItemRows({ items }: OrderItemRowsProps) {
  return (
    <View className="rounded-12 border-1 border-border bg-surface px-4">
      {items.map((item, index) => (
        <View
          key={item.id}
          className={`min-h-tap flex-row items-center gap-3 py-3 ${
            index < items.length - 1 ? 'border-b-1 border-border' : ''
          }`}>
          <ProductThumbnail uri={orderItemPhoto(item)} />

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
  );
}
