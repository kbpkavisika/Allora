import { zodResolver } from '@hookform/resolvers/zod';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { FormError } from '@/components/ui/FormError';
import { InputField } from '@/components/ui/InputField';
import { ProductPhotoGrid } from '@/components/ui/ProductPhotoGrid';
import { StarRating } from '@/components/ui/StarRating';
import { TopBar } from '@/components/ui/TopBar';
import { useAuth } from '@/lib/AuthProvider';
import { uploadProductPhotos } from '@/lib/photoUpload';
import { findPurchaseOrderId, submitReview } from '@/lib/reviews';
import { reviewSchema, type ReviewValues } from '@/lib/schemas';

export default function WriteReviewScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { session } = useAuth();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ReviewValues>({
    resolver: zodResolver(reviewSchema),
    defaultValues: { rating: 0, headline: '', body: '', photos: [] },
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function onSubmit(values: ReviewValues) {
    const authorId = session?.user.id;
    if (!id || !authorId) return;

    setFormError(null);
    setIsSubmitting(true);

    try {
      const [photos, orderId] = await Promise.all([
        uploadProductPhotos(values.photos),
        findPurchaseOrderId(id, authorId),
      ]);

      const { error } = await submitReview({
        productId: id,
        authorId,
        orderId,
        rating: values.rating,
        headline: values.headline,
        body: values.body,
        photos,
      });

      if (error) {
        setFormError(t('reviews.postError'));
        return;
      }

      router.back();
    } catch {
      setFormError(t('reviews.uploadError'));
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!id) {
    return (
      <View className="flex-1 bg-surface">
        <TopBar title={t('reviews.write')} />
        <View className="items-center gap-3 p-4 pt-16">
          <Text role="heading" className="type-h3 text-primary">
            {t('product.notFound')}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-surface">
      <TopBar title={t('reviews.write')} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 32, gap: 24 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <Controller
            control={control}
            name="rating"
            render={({ field }) => (
              <View className="gap-1">
                <Text className="type-label-lg text-primary" maxFontSizeMultiplier={2}>
                  {t('reviews.yourRating')}
                </Text>
                <StarRating
                  value={field.value}
                  size="lg"
                  onChange={field.onChange}
                  label={t('reviews.yourRating')}
                />
                <FormError message={errors.rating?.message} />
              </View>
            )}
          />

          <Controller
            control={control}
            name="headline"
            render={({ field }) => (
              <InputField
                label={t('reviews.headline')}
                placeholder={t('reviews.headlinePlaceholder')}
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                error={errors.headline?.message}
                isRequired
              />
            )}
          />

          <Controller
            control={control}
            name="body"
            render={({ field }) => (
              <InputField
                label={t('reviews.body')}
                placeholder={t('reviews.bodyPlaceholder')}
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                error={errors.body?.message}
                isRequired
                multiline
              />
            )}
          />

          <Controller
            control={control}
            name="photos"
            render={({ field }) => (
              <ProductPhotoGrid
                label={t('reviews.photos')}
                photos={field.value}
                onChange={field.onChange}
                error={errors.photos?.message}
              />
            )}
          />

          <FormError message={formError} />

          <Button label={t('reviews.post')} loading={isSubmitting} onPress={handleSubmit(onSubmit)} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
