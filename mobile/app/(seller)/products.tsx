import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ProductListRow } from '@/components/seller/ProductListRow';
import { FilterChip, IconFilterChip } from '@/components/ui/FilterChip';
import { InputField } from '@/components/ui/InputField';
import { OptionList } from '@/components/ui/OptionList';
import { TopBar } from '@/components/ui/TopBar';
import { useProducts } from '@/hooks/useProducts';
import { LOW_STOCK_THRESHOLD, type Product } from '@/lib/products';

const SORT_OPTIONS = [
  'Newest',
  'Price: low to high',
  'Price: high to low',
  'Name: A to Z',
  'Stock: low to high',
] as const;

type SortOption = (typeof SORT_OPTIONS)[number];

const COMPARE: Record<SortOption, (a: Product, b: Product) => number> = {
  Newest: (a, b) => b.created_at.localeCompare(a.created_at),
  'Price: low to high': (a, b) => a.price - b.price,
  'Price: high to low': (a, b) => b.price - a.price,
  'Name: A to Z': (a, b) => a.name.localeCompare(b.name),
  'Stock: low to high': (a, b) => a.stock_quantity - b.stock_quantity,
};

export default function SellerProductsScreen() {
  const insets = useSafeAreaInsets();
  const { products, isLoading } = useProducts();

  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortOption>('Newest');
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [lowStockOnly, setLowStockOnly] = useState(false);

  const visibleProducts = useMemo(() => {
    const query = search.trim().toLowerCase();

    return products
      .filter((product) => {
        if (lowStockOnly && product.stock_quantity > LOW_STOCK_THRESHOLD) return false;
        if (!query) return true;
        return (
          product.name.toLowerCase().includes(query) ||
          product.category.toLowerCase().includes(query)
        );
      })
      .sort(COMPARE[sort]);
  }, [products, search, sort, lowStockOnly]);

  const hasProducts = products.length > 0;

  return (
    <View className="flex-1 bg-surface">
      <TopBar title="My products" />

      <FlatList
        data={visibleProducts}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 16,
          paddingBottom: insets.bottom + 32,
        }}
        ItemSeparatorComponent={() => <View className="h-px bg-border" />}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          <View className="mb-2 gap-4">
            <InputField
              variant="search"
              label="Search your products"
              placeholder="Search your products"
              value={search}
              onChangeText={setSearch}
              onClear={() => setSearch('')}
              autoCapitalize="none"
              autoCorrect={false}
            />

            <View className="flex-row items-start gap-2">
              <View className="flex-1">
                <FilterChip
                  label={`Sort: ${sort}`}
                  showChevron
                  onPress={() => setIsSortOpen((open) => !open)}
                />
              </View>

              <FilterChip
                label="Low stock"
                selected={lowStockOnly}
                onPress={() => setLowStockOnly((only) => !only)}
              />

              <IconFilterChip
                icon="filters"
                label="More filters"
                disabled
                onPress={() => {}}
              />
            </View>

            {isSortOpen ? (
              <OptionList
                label="Sort products by"
                options={SORT_OPTIONS}
                value={sort}
                onChange={(next) => {
                  setSort(next as SortOption);
                  setIsSortOpen(false);
                }}
              />
            ) : null}
          </View>
        }
        renderItem={({ item }) => (
          <ProductListRow
            product={item}
            onPress={() =>
              router.push({ pathname: '/seller/edit-product', params: { id: item.id } })
            }
          />
        )}
        ListEmptyComponent={
          isLoading ? (
            <ActivityIndicator className="mt-16 text-secondary" />
          ) : (
            <Text className="type-text-primary mt-16 text-center text-secondary">
              {hasProducts
                ? 'No products match your search.'
                : "You haven't added any products yet."}
            </Text>
          )
        }
      />
    </View>
  );
}
