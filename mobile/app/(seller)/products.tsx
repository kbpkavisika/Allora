import { Image } from 'expo-image';
import { router } from 'expo-router';
import { FlatList, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { mockSellerProducts, type SellerProduct } from '@/lib/mockProducts';

function stockStatus(stockQuantity: string) {
  const quantity = Number(stockQuantity);

  if (quantity <= 0) {
    return { label: 'Sold out', className: 'text-secondary' };
  }
  if (quantity <= 10) {
    return { label: `Low stock · ${quantity} left`, className: 'text-warning' };
  }
  return { label: `${quantity} in stock`, className: 'text-success' };
}

function ProductCard({ product }: { product: SellerProduct }) {
  const stock = stockStatus(product.stockQuantity);

  return (
    <View className="flex-row gap-4 rounded-12 border-1 border-border bg-surface p-3">
      <View className="h-[104px] w-[104px] items-center justify-center overflow-hidden rounded-8 bg-surface-sunken">
        {product.imageUri ? (
          <Image
            source={{ uri: product.imageUri }}
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
          {product.category} · ${product.price}
        </Text>
        <Text className={`type-label-sm ${stock.className}`}>{stock.label}</Text>

        <Button
          variant="secondary"
          size="sm"
          label="Edit"
          fullWidth={false}
          className="mt-2"
          onPress={() => router.push({ pathname: '/edit-product', params: { id: product.id } })}
        />
      </View>
    </View>
  );
}

export default function ProductsScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 bg-surface">
      <FlatList
        data={mockSellerProducts}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: insets.top + 16,
          paddingBottom: insets.bottom + 32,
          gap: 12,
        }}
        ListHeaderComponent={
          <View className="mb-6 gap-4">
            <ScreenHeader title="Your products" />
            <Button
              variant="secondary"
              label="Add product"
              fullWidth={false}
              onPress={() => router.push('/add-product')}
            />
          </View>
        }
        renderItem={({ item }) => <ProductCard product={item} />}
        ListEmptyComponent={
          <Text className="type-text-primary text-secondary">
            You haven&apos;t added any products yet.
          </Text>
        }
      />
    </View>
  );
}
