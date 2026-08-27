import { Image } from 'expo-image';
import { Text, View } from 'react-native';

import { QuantityStepper } from '@/components/cart/QuantityStepper';
import { Icon } from '@/components/ui/Icon';
import { IconButton } from '@/components/ui/IconButton';
import type { CartLineItem } from '@/lib/CartProvider';

export interface CartItemRowProps {
  item: CartLineItem;
  onChangeQuantity: (quantity: number) => void;
  onRemove: () => void;
}

export function CartItemRow({ item, onChangeQuantity, onRemove }: CartItemRowProps) {
  const { product, quantity } = item;
  const lineTotal = (Number(product.price) * quantity).toFixed(2);

  return (
    <View className="gap-3 rounded-12 border-1 border-border bg-surface p-3">
      <View className="flex-row gap-3">
        <View className="h-[72px] w-[72px] items-center justify-center overflow-hidden rounded-8 bg-surface-sunken">
          {product.photos[0] ? (
            <Image
              source={{ uri: product.photos[0] }}
              style={{ width: '100%', height: '100%' }}
              contentFit="cover"
            />
          ) : (
            <Text className="type-label-sm text-secondary">No photo</Text>
          )}
        </View>

        <View className="flex-1 justify-center gap-1">
          <Text className="type-h3 text-primary" numberOfLines={1}>
            {product.name}
          </Text>
          <Text className="type-text-primary text-primary">${lineTotal}</Text>
        </View>
      </View>

      <View className="flex-row items-center justify-between">
        <QuantityStepper quantity={quantity} productName={product.name} onChange={onChangeQuantity} />
        <IconButton
          variant="outlined"
          diameter={44}
          icon={<Icon name="trash" size="md" className="text-error" />}
          label={`Remove ${product.name} from cart`}
          hint="Removes this item from your cart"
          onPress={onRemove}
        />
      </View>
    </View>
  );
}
