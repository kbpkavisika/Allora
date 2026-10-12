import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, FlatList, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ProductListRow } from '@/components/seller/ProductListRow';
import { FilterChip, IconFilterChip } from '@/components/ui/FilterChip';
import { InputField } from '@/components/ui/InputField';
import { OptionList } from '@/components/ui/OptionList';
import { TopBar } from '@/components/ui/TopBar';
import { useListPosition } from '@/hooks/useListPosition';
import { useProducts } from '@/hooks/useProducts';
import { LOW_STOCK_THRESHOLD, type Product } from '@/lib/products';

const SORT_OPTIONS = ['newest', 'priceAsc', 'priceDesc', 'nameAsc', 'stockAsc'] as const;

type SortOption = (typeof SORT_OPTIONS)[number];

const COMPARE: Record<SortOption, (a: Product, b: Product) => number> = {
  newest: (a, b) => b.created_at.localeCompare(a.created_at),
  priceAsc: (a, b) => a.price - b.price,
  priceDesc: (a, b) => b.price - a.price,
  nameAsc: (a, b) => a.name.localeCompare(b.name),
  stockAsc: (a, b) => a.stock_quantity - b.stock_quantity,
};

export default function SellerProductsScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { products, isLoading } = useProducts();
  const positionOf = useListPosition();

  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortOption>('newest');
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
      <TopBar title={t('tabs.myProducts')} />

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
              label={t('seller.products.search')}
              placeholder={t('seller.products.search')}
              value={search}
              onChangeText={setSearch}
              onClear={() => setSearch('')}
              autoCapitalize="none"
              autoCorrect={false}
            />

            <View className="flex-row items-start gap-2">
              <View className="flex-1">
                <FilterChip
                  label={t('sort.chip', { sort: t(`sort.${sort}`) })}
                  showChevron
                  onPress={() => setIsSortOpen((open) => !open)}
                />
              </View>

              <FilterChip
                label={t('stock.low')}
                selected={lowStockOnly}
                onPress={() => setLowStockOnly((only) => !only)}
              />

              <IconFilterChip
                icon="filters"
                label={t('seller.products.moreFilters')}
                disabled
                onPress={() => {}}
              />
            </View>

            {isSortOpen ? (
              <OptionList
                label={t('seller.products.sortBy')}
                options={SORT_OPTIONS}
                formatOption={(option) => t(`sort.${option}`)}
                value={sort}
                onChange={(next) => {
                  setSort(next as SortOption);
                  setIsSortOpen(false);
                }}
              />
            ) : null}
          </View>
        }
        renderItem={({ item, index }) => (
          <ProductListRow
            product={item}
            position={positionOf(index, visibleProducts.length)}
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
              {hasProducts ? t('seller.products.noMatch') : t('seller.products.none')}
            </Text>
          )
        }
      />
    </View>
  );
}
