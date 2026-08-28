import { Image } from 'expo-image';
import { Pressable, Text, View } from 'react-native';

import { Badge } from '@/components/ui/Badge';
import { Icon } from '@/components/ui/Icon';
import { formatMoney } from '@/lib/orders';
import { getStockStatus, type Product } from '@/lib/products';

export interface ProductTileProps {
  product: Product;
  onPress: () => void;
}

export function ProductTile({ product, onPress }: ProductTileProps) {
  const stock = getStockStatus(product.stock_quantity);
  const price = formatMoney(product.price);
  // In-stock is the default: only surface a badge when availability is a buying signal.
  const showBadge = stock.variant !== 'success';

  return (
    <Pressable
      onPress={onPress}
      role="button"
      aria-label={`${product.name}, ${price}, ${stock.detailLabel}`}
      accessibilityHint="Opens the product"
      className="w-full active:opacity-90">
      <View className="aspect-[3/4] w-full items-center justify-center overflow-hidden rounded-12 bg-surface-sunken">
        {product.photos[0] ? (
          <Image
            source={{ uri: product.photos[0] }}
            style={{ width: '100%', height: '100%' }}
            contentFit="cover"
            transition={120}
          />
        ) : (
          <Icon name="shop" size="lg" className="text-secondary" />
        )}
      </View>

      <View className="gap-2 pt-2">
        {showBadge ? <Badge label={stock.badgeLabel} variant={stock.variant} /> : null}
        <Text
          className="type-label-lg text-primary"
          numberOfLines={2}
          maxFontSizeMultiplier={1.5}>
          {product.name}
        </Text>
        <Text className="type-text-primary text-primary" maxFontSizeMultiplier={1.5}>
          {price}
        </Text>
      </View>
    </Pressable>
  );
}

export function ProductTileSkeleton() {
  return (
    <View className="w-full" aria-hidden accessibilityElementsHidden>
      <View className="aspect-[3/4] w-full rounded-12 bg-surface-sunken" />
      <View className="gap-2 pt-2">
        <View className="h-5 w-3/4 rounded-4 bg-surface-sunken" />
        <View className="h-4 w-1/3 rounded-4 bg-surface-sunken" />
      </View>
    </View>
  );
}
