import { useFocusEffect } from '@react-navigation/native';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
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
  reviewSortLabel,
  reviewSorts,
  summarizeReviews,
  type Review,
  type ReviewSort,
} from '@/lib/reviews';
import { supabase } from '@/lib/supabase';

export default function ProductReviewsScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id?: string }>();

  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sort, setSort] = useState<ReviewSort>('recent');
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
        <TopBar title={t('reviews.title')} />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator className="text-secondary" />
        </View>
      </View>
    );
  }

  if (!product) {
    return (
      <View className="flex-1 bg-surface">
        <TopBar title={t('reviews.title')} />
        <View className="items-center gap-3 p-4 pt-16">
          <Text role="heading" className="type-h3 text-primary">
            {t('product.notFound')}
          </Text>
          <Button
            variant="secondary"
            label={t('common.backToShop')}
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
            <ScreenHeader title={t('reviews.title')} subtitle={product.name} />

            {summary.total > 0 ? <RatingSummary summary={summary} /> : null}

            {summary.total > 0 ? (
              <View className="flex-row flex-wrap gap-2">
                <FilterChip
                  label={reviewSortLabel(sort)}
                  selected
                  showChevron
                  onPress={() => setIsSortOpen(true)}
                />
                <FilterChip
                  label={t('reviews.withPhotos')}
                  selected={photosOnly}
                  onPress={() => setPhotosOnly((current) => !current)}
                />
                <FilterChip
                  label={t('reviews.fiveStars')}
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
              {isFiltered ? t('reviews.noMatch') : t('reviews.none')}
            </Text>
            <Text
              className="type-text-primary text-center text-secondary"
              maxFontSizeMultiplier={2}>
              {isFiltered ? t('reviews.clearFilter') : t('reviews.beFirst')}
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
          label={t('reviews.write')}
          hint={t('reviews.writeHint')}
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
        <BottomSheet label={t('reviews.sortLabel')} onDismiss={() => setIsSortOpen(false)}>
          <Text role="heading" className="type-h2 mb-4 text-primary" maxFontSizeMultiplier={1.5}>
            {t('sort.title')}
          </Text>
          <OptionList
            label={t('reviews.sortLabel')}
            options={reviewSorts}
            formatOption={reviewSortLabel}
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
