import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, FlatList, Modal, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ProductListRow } from '@/components/seller/ProductListRow';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';
import { FilterChip, IconFilterChip } from '@/components/ui/FilterChip';
import { Icon } from '@/components/ui/Icon';
import { IconButton } from '@/components/ui/IconButton';
import { InputField } from '@/components/ui/InputField';
import { OptionList } from '@/components/ui/OptionList';
import { TopBar } from '@/components/ui/TopBar';
import { useListPosition } from '@/hooks/useListPosition';
import { useProducts } from '@/hooks/useProducts';
import { useProductsRefresh } from '@/hooks/useProductsRefresh';
import { useReduceMotion } from '@/hooks/useReduceMotion';
import { translateOption } from '@/lib/i18n';
import { LOW_STOCK_THRESHOLD, type Product } from '@/lib/products';
import { productCategories } from '@/lib/sellerSchemas';

const SORT_OPTIONS = ['newest', 'priceAsc', 'priceDesc', 'nameAsc', 'stockAsc'] as const;

type SortOption = (typeof SORT_OPTIONS)[number];

const COMPARE: Record<SortOption, (a: Product, b: Product) => number> = {
  newest: (a, b) => b.created_at.localeCompare(a.created_at),
  priceAsc: (a, b) => a.price - b.price,
  priceDesc: (a, b) => b.price - a.price,
  nameAsc: (a, b) => a.name.localeCompare(b.name),
  stockAsc: (a, b) => a.stock_quantity - b.stock_quantity,
};

const ALL = 'all';

const STOCK_FILTERS = [ALL, 'inStock', 'low', 'soldOut'] as const;

type StockFilter = (typeof STOCK_FILTERS)[number];

const MATCHES_STOCK: Record<StockFilter, (quantity: number) => boolean> = {
  all: () => true,
  inStock: (quantity) => quantity > LOW_STOCK_THRESHOLD,
  low: (quantity) => quantity > 0 && quantity <= LOW_STOCK_THRESHOLD,
  soldOut: (quantity) => quantity <= 0,
};

const CATEGORY_FILTERS = [ALL, ...productCategories] as const;

export default function SellerProductsScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const reduceMotion = useReduceMotion();
  const { products, isLoading } = useProducts();
  const { isRefreshing, pullToRefresh } = useProductsRefresh();
  const positionOf = useListPosition();

  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortOption>('newest');
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [stockFilter, setStockFilter] = useState<StockFilter>(ALL);
  const [categoryFilter, setCategoryFilter] = useState<string>(ALL);

  const visibleProducts = useMemo(() => {
    const query = search.trim().toLowerCase();

    return products
      .filter((product) => {
        if (!MATCHES_STOCK[stockFilter](product.stock_quantity)) return false;
        if (categoryFilter !== ALL && product.category !== categoryFilter) return false;
        if (!query) return true;
        return (
          product.name.toLowerCase().includes(query) ||
          product.category.toLowerCase().includes(query) ||
          translateOption(product.category).toLowerCase().includes(query)
        );
      })
      .sort(COMPARE[sort]);
  }, [products, search, sort, stockFilter, categoryFilter]);

  const hasProducts = products.length > 0;
  const activeFilterCount = (stockFilter === ALL ? 0 : 1) + (categoryFilter === ALL ? 0 : 1);

  function addProduct() {
    router.push('/seller/add-product');
  }

  function clearFilters() {
    setStockFilter(ALL);
    setCategoryFilter(ALL);
  }

  return (
    <View className="flex-1 bg-surface">
      <TopBar
        title={t('tabs.myProducts')}
        trailing={
          <IconButton
            icon={<Icon name="plus" size="lg" className="text-primary" />}
            label={t('seller.home.addProduct')}
            hint={t('seller.products.addHint')}
            onPress={addProduct}
          />
        }
      />

      <FlatList
        data={visibleProducts}
        keyExtractor={(item) => item.id}
        refreshing={isRefreshing}
        onRefresh={pullToRefresh}
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
                selected={stockFilter === 'low'}
                onPress={() => setStockFilter((current) => (current === 'low' ? ALL : 'low'))}
              />

              <IconFilterChip
                icon="filters"
                label={
                  activeFilterCount > 0
                    ? t('seller.products.moreFiltersActive', { count: activeFilterCount })
                    : t('seller.products.moreFilters')
                }
                selected={activeFilterCount > 0}
                onPress={() => setIsFiltersOpen(true)}
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
          isLoading && !hasProducts ? (
            <ActivityIndicator className="mt-16 text-secondary" />
          ) : hasProducts ? (
            <View className="mt-16 items-center gap-4">
              <Text className="type-text-primary text-center text-secondary">
                {t('seller.products.noMatch')}
              </Text>
              {activeFilterCount > 0 ? (
                <Button
                  variant="secondary"
                  label={t('seller.products.clearFilters')}
                  fullWidth={false}
                  onPress={clearFilters}
                />
              ) : null}
            </View>
          ) : (
            <View className="mt-16 items-center gap-4">
              <Text className="type-text-primary text-center text-secondary">
                {t('seller.products.none')}
              </Text>
              <Button
                label={t('seller.home.addProduct')}
                hint={t('seller.products.addHint')}
                fullWidth={false}
                onPress={addProduct}
              />
            </View>
          )
        }
      />

      <Modal
        visible={isFiltersOpen}
        transparent
        animationType={reduceMotion ? 'none' : 'fade'}
        onRequestClose={() => setIsFiltersOpen(false)}>
        <BottomSheet
          label={t('seller.products.filtersTitle')}
          onDismiss={() => setIsFiltersOpen(false)}>
          <Text role="heading" className="type-h2 mb-4 text-primary" maxFontSizeMultiplier={1.5}>
            {t('seller.products.filtersTitle')}
          </Text>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 16 }}>
            <View className="gap-2">
              <Text className="type-label-lg text-primary">{t('seller.products.stockHeading')}</Text>
              <OptionList
                label={t('seller.products.stockHeading')}
                options={STOCK_FILTERS}
                formatOption={(option) =>
                  option === ALL ? t('seller.products.anyStock') : t(`stock.${option}`)
                }
                value={stockFilter}
                onChange={(next) => setStockFilter(next as StockFilter)}
              />
            </View>

            <View className="gap-2">
              <Text className="type-label-lg text-primary">
                {t('seller.products.categoryHeading')}
              </Text>
              <OptionList
                label={t('seller.products.categoryHeading')}
                options={CATEGORY_FILTERS}
                formatOption={(option) =>
                  option === ALL ? t('seller.products.allCategories') : translateOption(option)
                }
                value={categoryFilter}
                onChange={setCategoryFilter}
              />
            </View>

            <View className="flex-row gap-3">
              <View className="flex-1">
                <Button
                  variant="secondary"
                  label={t('seller.products.clearFilters')}
                  disabled={activeFilterCount === 0}
                  onPress={clearFilters}
                />
              </View>
              <View className="flex-1">
                <Button
                  label={t('seller.products.showResults', { count: visibleProducts.length })}
                  onPress={() => setIsFiltersOpen(false)}
                />
              </View>
            </View>
          </ScrollView>
        </BottomSheet>
      </Modal>
    </View>
  );
}
