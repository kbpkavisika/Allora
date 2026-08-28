import { Image } from 'expo-image';
import { router } from 'expo-router';
import { ActivityIndicator, FlatList, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { useProducts } from '@/hooks/useProducts';
import { formatPrice, getStockStatus, type Product } from '@/lib/products';

function ProductCard({ product }: { product: Product }) {
  const stock = getStockStatus(product.stock_quantity);

  return (
    <View className="flex-row gap-4 rounded-12 border-1 border-border bg-surface p-3">
      <View className="h-[104px] w-[104px] items-center justify-center overflow-hidden rounded-8 bg-surface-sunken">
        {product.photos[0] ? (
          <Image
            source={{ uri: product.photos[0] }}
            style={{ width: '100%', height: '100%' }}
            contentFit="cover"
          />
        ) : (
          <Text className="type-label-sm text-secondary">No photo</Text>
        )}
      </View>

      <View className="flex-1 justify-center gap-1">
        <Text className="type-h3 text-primary" numberOfLines={1}>
          {product.name}
        </Text>
        <Text className="type-text-secondary text-secondary">
          {product.category} · {formatPrice(product.price)}
        </Text>
        <Badge label={stock.badgeLabel} variant={stock.variant} />

        <Button
          variant="secondary"
          size="sm"
          label="Edit"
          fullWidth={false}
          className="mt-2"
          onPress={() =>
            router.push({ pathname: '/seller/edit-product', params: { id: product.id } })
          }
        />
      </View>
    </View>
  );
}

export default function SellerProductsScreen() {
  const insets = useSafeAreaInsets();
  const { products, isLoading } = useProducts();

  return (
    <View className="flex-1 bg-surface">
      <FlatList
        data={products}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: insets.top + 16,
          paddingBottom: insets.bottom + 32,
          gap: 12,
        }}
        ListHeaderComponent={
          <View className="mb-6 gap-6">
            <ScreenHeader title="Your products" />
            <Button
              variant="secondary"
              label="Add product"
              fullWidth={false}
              onPress={() => router.push('/seller/add-product')}
            />
          </View>
        }
        renderItem={({ item }) => <ProductCard product={item} />}
        ListEmptyComponent={
          isLoading ? (
            <ActivityIndicator className="text-secondary" />
          ) : (
            <Text className="type-text-primary text-secondary">
              You haven&apos;t added any products yet.
            </Text>
          )
        }
      />
    </View>
  );
}
