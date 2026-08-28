import { router } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  RefreshControl,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';
import { FilterChip } from '@/components/ui/FilterChip';
import { Icon } from '@/components/ui/Icon';
import { IconButton } from '@/components/ui/IconButton';
import { InputField } from '@/components/ui/InputField';
import { OptionList } from '@/components/ui/OptionList';
import { ProductTile, ProductTileSkeleton } from '@/components/ui/ProductTile';
import { ScrollTabs, type ScrollTabItem } from '@/components/ui/ScrollTabs';
import { BROWSE_PAGE_SIZE, fetchProducts, productSorts, type ProductSort } from '@/lib/browse';
import { useCart } from '@/lib/CartProvider';
import type { Product } from '@/lib/products';
import { shopCategories } from '@/lib/shop';

// design.md §03: "tiles 2-up, gap 2" — product tiles bleed to the screen edge with a 2px gap on
// both axes. The 16px gutter is restored for the search field, category tabs, and filter row.
const TILE_GAP = 2;

const CATEGORY_TABS: ScrollTabItem[] = [
  { value: 'all', label: 'All' },
  ...shopCategories.map((category) => ({ value: category, label: category })),
];

type LoadMode = 'reset' | 'more' | 'refresh';

interface Query {
  search: string;
  category: string;
  sort: ProductSort;
}

export default function ShopScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const tileWidth = (width - TILE_GAP) / 2;

  const [searchText, setSearchText] = useState('');
  const [query, setQuery] = useState<Query>({ search: '', category: 'all', sort: 'Newest' });
  const [isSortOpen, setIsSortOpen] = useState(false);

  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPaginating, setIsPaginating] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [hasError, setHasError] = useState(false);

  const pageRef = useRef(0);
  const requestRef = useRef(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setQuery((current) => ({ ...current, search: searchText }));
    }, 300);
    return () => clearTimeout(timer);
  }, [searchText]);

  const load = useCallback(
    async (mode: LoadMode) => {
      const nextPage = mode === 'more' ? pageRef.current + 1 : 0;
      const requestId = ++requestRef.current;

      if (mode === 'reset') setIsLoading(true);
      if (mode === 'more') setIsPaginating(true);
      if (mode === 'refresh') setIsRefreshing(true);

      const { products: rows, error } = await fetchProducts({
        search: query.search,
        category: query.category === 'all' ? null : query.category,
        sort: query.sort,
        page: nextPage,
      });

      // A newer query started while this one was in flight — drop the stale response.
      if (requestId !== requestRef.current) return;

      if (error) {
        setHasError(true);
      } else {
        setHasError(false);
        pageRef.current = nextPage;
        setHasMore(rows.length === BROWSE_PAGE_SIZE);
        setProducts((current) => (mode === 'more' ? [...current, ...rows] : rows));
      }

      setIsLoading(false);
      setIsPaginating(false);
      setIsRefreshing(false);
    },
    [query]
  );

  useEffect(() => {
    load('reset');
  }, [load]);

  const loadMore = useCallback(() => {
    if (isLoading || isPaginating || isRefreshing || !hasMore) return;
    load('more');
  }, [isLoading, isPaginating, isRefreshing, hasMore, load]);

  return (
    <View className="flex-1 bg-surface">
      <ShopTopBar />

      <InputField
        variant="search"
        value={searchText}
        onChangeText={setSearchText}
        onClear={() => setSearchText('')}
        placeholder="Search Allora"
        returnKeyType="search"
        className="px-4 pt-4"
      />

      <ScrollTabs
        tabs={CATEGORY_TABS}
        value={query.category}
        onChange={(category) => setQuery((current) => ({ ...current, category }))}
        label="Filter by category"
        className="mt-4"
      />

      <View className="flex-row items-center gap-2 px-4 py-3">
        <FilterChip
          label={`Sort: ${query.sort}`}
          showChevron
          selected={query.sort !== 'Newest'}
          onPress={() => setIsSortOpen(true)}
        />
      </View>

      <FlatList
        className="flex-1"
        data={isLoading ? [] : products}
        numColumns={2}
        keyExtractor={(item) => item.id}
        columnWrapperStyle={{ gap: TILE_GAP, marginBottom: TILE_GAP }}
        contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={() => load('refresh')} />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        renderItem={({ item }) => (
          <View style={{ width: tileWidth }}>
            <ProductTile
              product={item}
              onPress={() =>
                router.push({ pathname: '/product/[id]', params: { id: item.id } })
              }
            />
          </View>
        )}
        ListEmptyComponent={
          isLoading ? (
            <LoadingGrid tileWidth={tileWidth} />
          ) : (
            <EmptyState hasError={hasError} onRetry={() => load('reset')} />
          )
        }
        ListFooterComponent={
          isPaginating ? (
            <ActivityIndicator className="py-6 text-secondary" />
          ) : hasMore && products.length > 0 ? (
            <View className="items-center py-6">
              <Button
                variant="secondary"
                size="md"
                label={`Load ${BROWSE_PAGE_SIZE} more`}
                fullWidth={false}
                onPress={loadMore}
              />
            </View>
          ) : null
        }
      />

      <Modal
        visible={isSortOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsSortOpen(false)}>
        <BottomSheet label="Sort products" onDismiss={() => setIsSortOpen(false)}>
          <Text role="heading" className="type-h2 mb-4 text-primary" maxFontSizeMultiplier={1.5}>
            Sort
          </Text>
          <OptionList
            label="Sort products"
            options={productSorts}
            value={query.sort}
            onChange={(sort) => {
              setQuery((current) => ({ ...current, sort: sort as ProductSort }));
              setIsSortOpen(false);
            }}
          />
        </BottomSheet>
      </Modal>
    </View>
  );
}

function ShopTopBar() {
  const insets = useSafeAreaInsets();
  const { itemCount } = useCart();

  return (
    <View className="bg-surface" style={{ paddingTop: insets.top }}>
      <View className="h-[56px] flex-row items-center justify-between border-b-1 border-border px-4">
        <Text className="type-wordmark text-primary" maxFontSizeMultiplier={1.3}>
          allora
        </Text>

        <View>
          <IconButton
            icon={<Icon name="cart" size="lg" className="text-primary" />}
            label={itemCount > 0 ? `Cart, ${itemCount} item${itemCount === 1 ? '' : 's'}` : 'Cart'}
            hint="Opens your cart"
            onPress={() => router.push('/(tabs)/cart')}
          />
          {itemCount > 0 ? (
            <View
              pointerEvents="none"
              className="absolute right-0 top-0 h-4 items-center justify-center rounded-full bg-accent px-1">
              <Text
                className="type-mono text-surface"
                style={{ fontSize: 10, lineHeight: 12 }}
                maxFontSizeMultiplier={1.3}>
                {itemCount > 9 ? '9+' : itemCount}
              </Text>
            </View>
          ) : null}
        </View>
      </View>
    </View>
  );
}

function LoadingGrid({ tileWidth }: { tileWidth: number }) {
  return (
    <View className="flex-row flex-wrap" style={{ gap: TILE_GAP }}>
      {Array.from({ length: 6 }).map((_, index) => (
        <View key={index} style={{ width: tileWidth }}>
          <ProductTileSkeleton />
        </View>
      ))}
    </View>
  );
}

function EmptyState({ hasError, onRetry }: { hasError: boolean; onRetry: () => void }) {
  return (
    <View className="items-center gap-3 px-4 pt-16">
      <Text
        role="heading"
        className="type-h3 text-center text-primary"
        maxFontSizeMultiplier={1.5}>
        {hasError ? 'Could not load products' : 'No products found'}
      </Text>
      <Text className="type-text-primary text-center text-secondary" maxFontSizeMultiplier={2}>
        {hasError
          ? 'Check your connection and try again.'
          : 'Try a different search or category.'}
      </Text>
      {hasError ? (
        <Button variant="secondary" size="md" label="Try again" fullWidth={false} onPress={onRetry} />
      ) : null}
    </View>
  );
}
