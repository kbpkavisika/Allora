import { router } from 'expo-router';
import { FlatList, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CartItemRow } from '@/components/cart/CartItemRow';
import { Button } from '@/components/ui/Button';
import { SuccessBanner } from '@/components/ui/SuccessBanner';
import { useCart } from '@/lib/CartProvider';

export default function CartScreen() {
  const insets = useSafeAreaInsets();
  const { lineItems, itemCount, subtotal, updateQuantity, removeItem } = useCart();

  // Persistent, not a fading toast: wireframe S11 note — a deaf buyer re-checks the cart
  // after every action when feedback is audio-only, so the count/total stay on screen.
  const bannerMessage =
    itemCount > 0
      ? `Cart has ${itemCount} item${itemCount === 1 ? '' : 's'}, $${subtotal.toFixed(2)} total.`
      : null;

  return (
    <View className="flex-1 bg-surface">
      <FlatList
        data={lineItems}
        keyExtractor={(item) => item.product.id}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 16,
          paddingBottom: insets.bottom + 32,
          gap: 12,
        }}
        ListHeaderComponent={
          <View className="mb-6 gap-4">
            <Text role="heading" className="type-h1 text-primary" maxFontSizeMultiplier={1.5}>
              Cart{itemCount > 0 ? ` · ${itemCount} item${itemCount === 1 ? '' : 's'}` : ''}
            </Text>
            <SuccessBanner message={bannerMessage} />
          </View>
        }
        renderItem={({ item }) => (
          <CartItemRow
            item={item}
            onChangeQuantity={(quantity) => updateQuantity(item.product.id, quantity)}
            onRemove={() => removeItem(item.product.id)}
          />
        )}
        ListEmptyComponent={
          <Text className="type-text-primary text-secondary">
            Your cart is empty. Items you add will appear here.
          </Text>
        }
        ListFooterComponent={
          lineItems.length > 0 ? (
            <View className="mt-6 gap-4 border-t-1 border-border pt-4">
              <View className="flex-row items-center justify-between">
                <Text className="type-label-lg text-primary">Total</Text>
                <Text className="type-h3 text-primary">${subtotal.toFixed(2)}</Text>
              </View>
              <Button
                label="Checkout"
                onPress={() => router.push('/payment/checkout')}
                hint="Proceeds to payment for the items in your cart"
              />
            </View>
          ) : null
        }
      />
    </View>
  );
}
