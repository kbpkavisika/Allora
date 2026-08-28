import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Divider } from '@/components/ui/Divider';
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
  const hasDescription = product.description.trim().length > 0;

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
        <PhotoCarousel photos={product.photos} name={product.name} />

        <View className="gap-5 p-4">
          <View className="gap-2">
            <Text role="heading" className="type-h1 text-primary" maxFontSizeMultiplier={1.5}>
              {product.name}
            </Text>
            <Text className="type-text-lg text-primary" maxFontSizeMultiplier={2}>
              {formatMoney(product.price)}
            </Text>
            <View className="flex-row items-center gap-2">
              <Badge label={stock.badgeLabel} variant={stock.variant} />
              <Text
                className="type-text-secondary text-secondary"
                maxFontSizeMultiplier={2}>
                {stock.detailLabel}
              </Text>
            </View>
          </View>

          {hasDescription ? (
            <>
              <Divider />
              <View className="gap-2">
                <Text
                  role="heading"
                  className="type-h3 text-primary"
                  maxFontSizeMultiplier={1.5}>
                  Description
                </Text>
                <Text className="type-text-primary text-primary" maxFontSizeMultiplier={2}>
                  {product.description}
                </Text>
              </View>
            </>
          ) : null}
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

function PhotoCarousel({ photos, name }: { photos: string[]; name: string }) {
  const { width } = useWindowDimensions();
  const [index, setIndex] = useState(0);
  // Explicit square viewport: a horizontal FlatList does not constrain its cross axis, so an
  // aspect-ratio-only item collapses to no height.
  const size = width;

  if (photos.length === 0) {
    return (
      <View
        style={{ width, height: size }}
        className="items-center justify-center bg-surface-sunken">
        <Icon name="shop" size="lg" className="text-secondary" />
      </View>
    );
  }

  return (
    <View>
      <FlatList
        data={photos}
        horizontal
        pagingEnabled
        style={{ height: size }}
        showsHorizontalScrollIndicator={false}
        keyExtractor={(uri, i) => `${i}-${uri}`}
        onMomentumScrollEnd={(event) =>
          setIndex(Math.round(event.nativeEvent.contentOffset.x / width))
        }
        renderItem={({ item, index: i }) => (
          // contentFit "contain" so the whole photo is visible — seller uploads are not
          // a fixed aspect ratio, and cropping was hiding parts of the product.
          <View
            style={{ width, height: size }}
            className="items-center justify-center bg-surface-sunken">
            <Image
              source={{ uri: item }}
              style={{ width: '100%', height: '100%' }}
              contentFit="contain"
              transition={150}
              alt={`${name}, photo ${i + 1} of ${photos.length}`}
            />
          </View>
        )}
      />

      {photos.length > 1 ? (
        <View
          className="flex-row items-center justify-center gap-2 py-3"
          aria-label={`Photo ${index + 1} of ${photos.length}`}>
          {photos.map((_, i) => (
            <View
              key={i}
              className={`h-1 rounded-full ${
                i === index ? 'w-[22px] bg-primary' : 'w-2 bg-inert'
              }`}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}
