import { zodResolver } from '@hookform/resolvers/zod';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
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
        setFormError('Could not post your review. Please try again.');
        return;
      }

      router.back();
    } catch {
      setFormError('Could not upload your photos. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!id) {
    return (
      <View className="flex-1 bg-surface">
        <TopBar title="Write a review" />
        <View className="items-center gap-3 p-4 pt-16">
          <Text role="heading" className="type-h3 text-primary">
            Product not found
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-surface">
      <TopBar title="Write a review" />

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
                  Your rating
                </Text>
                <StarRating
                  value={field.value}
                  size="lg"
                  onChange={field.onChange}
                  label="Your rating"
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
                label="Headline"
                placeholder="Sum up your experience in a few words."
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
                label="Your review"
                placeholder="What worked well, and what would you tell another shopper?"
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
                label="Photos"
                photos={field.value}
                onChange={field.onChange}
                error={errors.photos?.message}
              />
            )}
          />

          <FormError message={formError} />

          <Button label="Post review" loading={isSubmitting} onPress={handleSubmit(onSubmit)} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
