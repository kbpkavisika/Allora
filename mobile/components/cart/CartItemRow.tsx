import { Image } from 'expo-image';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

import { QuantityStepper } from '@/components/ui/QuantityStepper';
import { Icon } from '@/components/ui/Icon';
import { IconButton } from '@/components/ui/IconButton';
import { cartLineStockIssue, type CartLine } from '@/lib/cart';
import { formatMoney } from '@/lib/orders';

export interface CartItemRowProps {
  line: CartLine;
  onChangeQuantity: (quantity: number) => void;
  onRemove: () => void;
}

export function CartItemRow({ line, onChangeQuantity, onRemove }: CartItemRowProps) {
  const { t } = useTranslation();
  const { product, quantity } = line;
  const stockIssue = cartLineStockIssue(line);

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
            <Icon name="shop" size="md" className="text-secondary" />
          )}
        </View>

        <View className="flex-1 justify-center gap-1">
          <Text className="type-h3 text-primary" numberOfLines={1}>
            {product.name}
          </Text>
          <Text className="type-text-secondary text-secondary">
            {t('cart.each', { price: formatMoney(product.price) })}
          </Text>
          {stockIssue ? (
            <Text className="type-text-secondary text-error">
              {stockIssue === 'soldOut'
                ? t('cart.soldOut')
                : t('cart.overStock', { count: product.stock_quantity })}
            </Text>
          ) : null}
        </View>
      </View>

      <View className="flex-row items-center justify-between">
        <QuantityStepper
          quantity={quantity}
          productName={product.name}
          onChange={onChangeQuantity}
          max={product.stock_quantity}
        />
        <IconButton
          variant="outlined"
          diameter={44}
          icon={<Icon name="trash" size="md" className="text-error" />}
          label={t('cart.remove', { name: product.name })}
          hint={t('cart.removeHint')}
          onPress={onRemove}
        />
      </View>
    </View>
  );
}
