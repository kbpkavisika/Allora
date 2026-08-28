import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { Toast } from '@/components/ui/Toast';
import { TopBar } from '@/components/ui/TopBar';
import { useCart } from '@/lib/CartProvider';
import { formatMoney } from '@/lib/orders';
import { getStockStatus, type Product } from '@/lib/products';
import { supabase } from '@/lib/supabase';

export default function ProductDetailScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { addItem } = useCart();

  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .maybeSingle()
      .then(({ data }) => {
        setProduct((data as Product) ?? null);
        setIsLoading(false);
      });
  }, [id]);

  if (isLoading) {
    return (
      <View className="flex-1 bg-surface">
        <TopBar title="Product" />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator className="text-secondary" />
        </View>
      </View>
    );
  }

  if (!product) {
    return (
      <View className="flex-1 bg-surface">
        <TopBar title="Product" />
        <View className="items-center gap-3 p-4 pt-16">
          <Text role="heading" className="type-h3 text-primary">
            Product not found
          </Text>
          <Button
            variant="secondary"
            label="Back to Shop"
            fullWidth={false}
            onPress={() => router.replace('/(tabs)')}
          />
        </View>
      </View>
    );
  }

  const stock = getStockStatus(product.stock_quantity);
  const soldOut = product.stock_quantity <= 0;

  async function handleAdd() {
    if (!product) return;
    setIsAdding(true);
    const { error } = await addItem(product.id);
    setIsAdding(false);
    setToast(error ? 'Could not add to cart. Try again.' : `${product.name} added to cart`);
  }

  return (
    <View className="flex-1 bg-surface">
      <TopBar title={product.name} />

      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 120 }}
        showsVerticalScrollIndicator={false}>
        <View className="aspect-[4/3] w-full items-center justify-center bg-surface-sunken">
          {product.photos[0] ? (
            <Image
              source={{ uri: product.photos[0] }}
              style={{ width: '100%', height: '100%' }}
              contentFit="cover"
            />
          ) : (
            <Icon name="shop" size="lg" className="text-secondary" />
          )}
        </View>

        <View className="gap-4 p-4">
          <View className="gap-2">
            <Text role="heading" className="type-h1 text-primary" maxFontSizeMultiplier={1.5}>
              {product.name}
            </Text>
            <Text className="type-text-lg text-primary">{formatMoney(product.price)}</Text>
            <View className="flex-row items-center gap-2">
              <Badge label={stock.badgeLabel} variant={stock.variant} />
              <Text className="type-text-secondary text-secondary">{stock.detailLabel}</Text>
            </View>
          </View>

          <Text className="type-text-primary text-primary">{product.description}</Text>
        </View>
      </ScrollView>

      <View
        className="absolute inset-x-0 bottom-0 border-t-1 border-border bg-surface px-4 pt-4"
        style={{ paddingBottom: insets.bottom + 16 }}>
        <Button
          label={soldOut ? 'Sold out' : `Add to cart · ${formatMoney(product.price)}`}
          loading={isAdding}
          disabled={soldOut}
          onPress={handleAdd}
          hint="Adds this item to your cart"
        />
      </View>

      <Toast
        message={toast}
        offset={72}
        actionLabel="View cart"
        onAction={() => {
          setToast(null);
          router.push('/(tabs)/cart');
        }}
        onDismiss={() => setToast(null)}
      />
    </View>
  );
}
