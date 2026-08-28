import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/ui/Icon';
import { formatMoney } from '@/lib/orders';
import type { Product } from '@/lib/products';
import { supabase } from '@/lib/supabase';

// Interim marketplace: a flat list of every shop's products so the cart/checkout flow is
// reachable. The Product team's Discover screen (design.md §09-01) replaces this.
export default function ShopScreen() {
  const insets = useSafeAreaInsets();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    setProducts((data ?? []) as Product[]);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <View className="flex-1 bg-surface">
      <FlatList
        data={products}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 16,
          paddingBottom: insets.bottom + 32,
          gap: 12,
        }}
        refreshControl={<RefreshControl refreshing={false} onRefresh={load} />}
        ListHeaderComponent={
          <Text
            role="heading"
            className="type-h1 mb-6 text-primary"
            maxFontSizeMultiplier={1.5}>
            Shop
          </Text>
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => router.push({ pathname: '/product/[id]', params: { id: item.id } })}
            role="button"
            aria-label={`${item.name}, ${formatMoney(item.price)}`}
            accessibilityHint="Opens the product"
            className="flex-row items-center gap-3 rounded-12 border-1 border-border bg-surface p-3 active:bg-surface-muted">
            <View className="h-16 w-16 items-center justify-center overflow-hidden rounded-8 bg-surface-sunken">
              {item.photos[0] ? (
                <Image
                  source={{ uri: item.photos[0] }}
                  style={{ width: '100%', height: '100%' }}
                  contentFit="cover"
                />
              ) : (
                <Icon name="shop" size="md" className="text-secondary" />
              )}
            </View>
            <View className="flex-1 gap-1">
              <Text className="type-label-lg text-primary" numberOfLines={1}>
                {item.name}
              </Text>
              <Text className="type-text-secondary text-secondary">{formatMoney(item.price)}</Text>
            </View>
            <Icon name="forward" size="md" className="text-secondary" />
          </Pressable>
        )}
        ListEmptyComponent={
          isLoading ? (
            <ActivityIndicator className="mt-16 text-secondary" />
          ) : (
            <Text className="type-text-primary mt-16 text-center text-secondary">
              No products are listed yet.
            </Text>
          )
        }
      />
    </View>
  );
}
