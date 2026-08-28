import { Image } from 'expo-image';
import { Pressable, Text, View } from 'react-native';

import { Badge } from '@/components/ui/Badge';
import { Icon } from '@/components/ui/Icon';
import { formatPrice, getStockStatus, type Product } from '@/lib/products';

export interface ProductListRowProps {
  product: Product;
  onPress: () => void;
}

export function ProductListRow({ product, onPress }: ProductListRowProps) {
  const stock = getStockStatus(product.stock_quantity);
  const cover = product.photos[0];

  return (
    <Pressable
      onPress={onPress}
      role="button"
      aria-label={`${product.name}, ${formatPrice(product.price)}, ${stock.detailLabel}`}
      accessibilityHint="Opens the product to edit it"
      className="min-h-tap flex-row items-center gap-3 py-3 active:bg-surface-muted">
      <View className="h-14 w-14 items-center justify-center overflow-hidden rounded-8 bg-surface-sunken">
        {cover ? (
          <Image
            source={{ uri: cover }}
            style={{ width: '100%', height: '100%' }}
            contentFit="cover"
          />
        ) : (
          <Icon name="shop" size="md" className="text-secondary" />
        )}
      </View>

      <View className="flex-1 gap-1">
        <Text className="type-label-lg text-primary" numberOfLines={1} maxFontSizeMultiplier={1.5}>
          {product.name}
        </Text>
        <Text className="type-text-secondary text-secondary" numberOfLines={1}>
          {formatPrice(product.price)}
        </Text>

        <View className="flex-row items-center gap-2">
          <Badge label={stock.badgeLabel} variant={stock.variant} />
          <Text className="type-text-secondary text-secondary" numberOfLines={1}>
            {stock.detailLabel}
          </Text>
        </View>
      </View>

      <Icon name="forward" size="md" className="text-secondary" />
    </Pressable>
  );
}
