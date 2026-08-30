import { useFocusEffect } from '@react-navigation/native';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Modal, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { RatingSummary } from '@/components/reviews/RatingSummary';
import { ReviewCard } from '@/components/reviews/ReviewCard';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';
import { Divider } from '@/components/ui/Divider';
import { FilterChip } from '@/components/ui/FilterChip';
import { OptionList } from '@/components/ui/OptionList';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { TopBar } from '@/components/ui/TopBar';
import type { Product } from '@/lib/products';
import {
  fetchProductReviews,
  reviewSorts,
  summarizeReviews,
  type Review,
  type ReviewSort,
} from '@/lib/reviews';
import { supabase } from '@/lib/supabase';

export default function ProductReviewsScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id?: string }>();

  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sort, setSort] = useState<ReviewSort>('Most recent');
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [photosOnly, setPhotosOnly] = useState(false);
  const [fiveStarsOnly, setFiveStarsOnly] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;

    const [{ data }, { reviews: rows }] = await Promise.all([
      supabase.from('products').select('*').eq('id', id).maybeSingle(),
      fetchProductReviews(id, sort),
    ]);

    setProduct((data as Product) ?? null);
    setReviews(rows);
    setIsLoading(false);
  }, [id, sort]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  // The summary always describes every review, so the filter chips never change the average.
  const summary = useMemo(() => summarizeReviews(reviews), [reviews]);

  const visibleReviews = useMemo(
    () =>
      reviews.filter(
        (review) =>
          (!photosOnly || review.photos.length > 0) && (!fiveStarsOnly || review.rating === 5)
      ),
    [reviews, photosOnly, fiveStarsOnly]
  );

  if (isLoading) {
    return (
      <View className="flex-1 bg-surface">
        <TopBar title="Reviews" />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator className="text-secondary" />
        </View>
      </View>
    );
  }

  if (!product) {
    return (
      <View className="flex-1 bg-surface">
        <TopBar title="Reviews" />
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

  const isFiltered = photosOnly || fiveStarsOnly;

  return (
    <View className="flex-1 bg-surface">
      <FlatList
        data={visibleReviews}
        keyExtractor={(review) => review.id}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: insets.top + 8,
          paddingBottom: insets.bottom + 120,
        }}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View className="gap-6 pb-6">
            <ScreenHeader title="Reviews" subtitle={product.name} />

            {summary.total > 0 ? <RatingSummary summary={summary} /> : null}

            {summary.total > 0 ? (
              <View className="flex-row flex-wrap gap-2">
                <FilterChip
                  label={sort}
                  selected
                  showChevron
                  onPress={() => setIsSortOpen(true)}
                />
                <FilterChip
                  label="With photos"
                  selected={photosOnly}
                  onPress={() => setPhotosOnly((current) => !current)}
                />
                <FilterChip
                  label="5 stars"
                  selected={fiveStarsOnly}
                  onPress={() => setFiveStarsOnly((current) => !current)}
                />
              </View>
            ) : null}
          </View>
        }
        ItemSeparatorComponent={() => <Divider className="my-5" />}
        ListEmptyComponent={
          <View className="items-center gap-2 pt-16">
            <Text role="heading" className="type-h3 text-primary" maxFontSizeMultiplier={1.5}>
              {isFiltered ? 'No reviews match those filters' : 'No reviews yet'}
            </Text>
            <Text
              className="type-text-primary text-center text-secondary"
              maxFontSizeMultiplier={2}>
              {isFiltered
                ? 'Clear a filter to see the rest of the reviews.'
                : 'Be the first to tell other shoppers what you think.'}
            </Text>
          </View>
        }
        renderItem={({ item }) => <ReviewCard review={item} />}
      />

      <View
        className="absolute inset-x-0 bottom-0 border-t-1 border-border bg-surface px-4 pt-4"
        style={{ paddingBottom: insets.bottom + 16 }}>
        <Button
          variant="secondary"
          label="Write a review"
          hint="Opens the review form for this product"
          onPress={() =>
            router.push({ pathname: '/product/[id]/write-review', params: { id: product.id } })
          }
        />
      </View>

      <Modal
        visible={isSortOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsSortOpen(false)}>
        <BottomSheet label="Sort reviews" onDismiss={() => setIsSortOpen(false)}>
          <Text role="heading" className="type-h2 mb-4 text-primary" maxFontSizeMultiplier={1.5}>
            Sort
          </Text>
          <OptionList
            label="Sort reviews"
            options={reviewSorts}
            value={sort}
            onChange={(next) => {
              setSort(next as ReviewSort);
              setIsSortOpen(false);
            }}
          />
        </BottomSheet>
      </Modal>
    </View>
  );
}
