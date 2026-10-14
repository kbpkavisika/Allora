import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, FlatList, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CartItemRow } from '@/components/cart/CartItemRow';
import { Button } from '@/components/ui/Button';
import { Callout } from '@/components/ui/Callout';
import { SuccessBanner } from '@/components/ui/SuccessBanner';
import { Toast } from '@/components/ui/Toast';
import { cartHasStockIssues, CartStockLimitError } from '@/lib/cart';
import { useCart } from '@/lib/CartProvider';
import { formatMoney } from '@/lib/orders';

export default function CartScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { lines, itemCount, subtotal, isLoading, updateQuantity, removeItem, refresh } = useCart();
  const [toast, setToast] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const hasStockIssues = cartHasStockIssues(lines);

  // Persistent, not a fading toast: wireframe S11 note — a deaf buyer re-checks the cart
  // after every action when feedback is audio-only, so the count/total stay on screen.
  const bannerMessage =
    itemCount > 0
      ? t('cart.banner', { count: itemCount, total: formatMoney(subtotal) })
      : null;

  function reportError(error: unknown) {
    if (!error) return;
    setToast(
      error instanceof CartStockLimitError
        ? t('cart.overStock', { count: error.available })
        : t('cart.updateError')
    );
  }

  if (isLoading && lines.length === 0) {
    return (
      <View className="flex-1 items-center justify-center bg-surface">
        <ActivityIndicator className="text-secondary" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-surface">
      <FlatList
        data={lines}
        keyExtractor={(line) => line.product.id}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 16,
          paddingBottom: insets.bottom + 32,
          gap: 12,
        }}
        ListHeaderComponent={
          <View className="mb-6 gap-4">
            <Text role="heading" className="type-h1 text-primary" maxFontSizeMultiplier={1.5}>
              {itemCount > 0 ? t('cart.titleWithCount', { count: itemCount }) : t('tabs.cart')}
            </Text>
            <SuccessBanner message={bannerMessage} />
          </View>
        }
        renderItem={({ item: line }) => (
          <CartItemRow
            line={line}
            onChangeQuantity={async (quantity) =>
              reportError((await updateQuantity(line.product.id, quantity)).error)
            }
            onRemove={async () => reportError((await removeItem(line.product.id)).error)}
          />
        )}
        ListEmptyComponent={
          <Text className="type-text-primary text-secondary">
            {t('cart.empty')}
          </Text>
        }
        ListFooterComponent={
          lines.length > 0 ? (
            <View className="mt-6 gap-4 border-t-1 border-border pt-4">
              <View className="flex-row items-center justify-between">
                <Text className="type-label-lg text-primary">{t('cart.total')}</Text>
                <Text className="type-h3 text-primary">{formatMoney(subtotal)}</Text>
              </View>
              {hasStockIssues ? <Callout tone="warning" message={t('cart.fixStock')} /> : null}
              <Button
                label={t('cart.checkout')}
                onPress={() => router.push('/payment/checkout')}
                disabled={hasStockIssues}
                hint={hasStockIssues ? t('cart.fixStock') : t('cart.checkoutHint')}
              />
            </View>
          ) : null
        }
      />

      <Toast message={toast} onDismiss={() => setToast(null)} />
    </View>
  );
}
