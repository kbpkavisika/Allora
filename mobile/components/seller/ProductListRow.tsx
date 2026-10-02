import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';

import { Badge } from '@/components/ui/Badge';
import { Icon } from '@/components/ui/Icon';
import { ProductThumbnail } from '@/components/ui/ProductThumbnail';
import { formatPrice, getStockStatus, type Product } from '@/lib/products';

export interface ProductListRowProps {
  product: Product;
  onPress: () => void;
  position?: string;
}

export function ProductListRow({ product, onPress, position }: ProductListRowProps) {
  const { t } = useTranslation();
  const stock = getStockStatus(product.stock_quantity);

  return (
    <Pressable
      onPress={onPress}
      role="button"
      aria-label={`${product.name}, ${formatPrice(product.price)}, ${stock.detailLabel}${position ? `, ${position}` : ''}`}
      accessibilityHint={t('seller.products.openHint')}
      className="min-h-tap flex-row items-center gap-3 py-3 active:bg-surface-muted">
      <ProductThumbnail uri={product.photos[0]} />

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
