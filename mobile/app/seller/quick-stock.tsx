import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, Text, View } from 'react-native';

import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';
import { FormError } from '@/components/ui/FormError';
import { QuantityStepper } from '@/components/ui/QuantityStepper';
import { useProducts } from '@/hooks/useProducts';

export default function QuickStockScreen() {
  const { t } = useTranslation();
  const { products, updateStock } = useProducts();

  const [quantities, setQuantities] = useState<Record<string, number>>(() =>
    Object.fromEntries(products.map((product) => [product.id, product.stock_quantity]))
  );
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const changed = products.filter(
    (product) => quantities[product.id] !== product.stock_quantity
  );

  function dismiss() {
    if (router.canGoBack()) router.back();
  }

  async function save() {
    setFormError(null);
    setIsSaving(true);

    const { error } = await updateStock(
      changed.map((product) => ({ id: product.id, stock_quantity: quantities[product.id] }))
    );

    setIsSaving(false);

    if (error) {
      setFormError(t('quickStock.saveError'));
      return;
    }

    dismiss();
  }

  return (
    <BottomSheet onDismiss={dismiss} label={t('seller.home.quickStock')}>
      <Text role="heading" className="type-h2 mb-4 text-primary" maxFontSizeMultiplier={1.5}>
        {t('seller.home.quickStock')}
      </Text>

      {products.length === 0 ? (
        <Text className="type-text-primary py-6 text-center text-secondary">
          {t('quickStock.empty')}
        </Text>
      ) : (
        <ScrollView
          className="mb-4"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          {products.map((product, index) => {
            const quantity = quantities[product.id] ?? product.stock_quantity;
            const isChanged = quantity !== product.stock_quantity;

            return (
              <View
                key={product.id}
                className={`min-h-tap flex-row items-center gap-3 py-3 ${
                  index < products.length - 1 ? 'border-b-1 border-border' : ''
                }`}>
                <View className="flex-1 gap-0.5">
                  <Text
                    className="type-label-lg text-primary"
                    numberOfLines={2}
                    maxFontSizeMultiplier={1.5}>
                    {product.name}
                  </Text>
                  <Text className="type-text-secondary text-secondary">
                    {isChanged
                      ? t('quickStock.was', { count: product.stock_quantity })
                      : t('stock.countInStock', { count: product.stock_quantity })}
                  </Text>
                </View>

                <QuantityStepper
                  quantity={quantity}
                  productName={product.name}
                  min={0}
                  onChange={(next) =>
                    setQuantities((current) => ({ ...current, [product.id]: next }))
                  }
                />
              </View>
            );
          })}
        </ScrollView>
      )}

      <FormError message={formError} className="mb-3" />

      <Button
        label={t('common.saveChanges')}
        loading={isSaving}
        disabled={changed.length === 0}
        onPress={save}
      />
    </BottomSheet>
  );
}
