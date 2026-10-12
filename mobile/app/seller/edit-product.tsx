import { zodResolver } from '@hookform/resolvers/zod';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Text, TextInput, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { ChipSelect } from '@/components/ui/ChipSelect';
import { FormError } from '@/components/ui/FormError';
import { KeyboardScreen } from '@/components/ui/KeyboardScreen';
import { ProductPhotoGrid } from '@/components/ui/ProductPhotoGrid';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { SuccessBanner } from '@/components/ui/SuccessBanner';
import { InputField } from '@/components/ui/InputField';
import { useProducts } from '@/hooks/useProducts';
import { toProductFormValues, toProductInput } from '@/lib/products';
import {
  productCategories,
  productDetailsSchema,
  type ProductDetailsValues,
} from '@/lib/sellerSchemas';
import { translateOption } from '@/lib/i18n';

export default function EditProductScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { products, isLoading, updateProduct } = useProducts();
  const product = products.find((item) => item.id === id);

  const nameRef = useRef<TextInput>(null);
  const descriptionRef = useRef<TextInput>(null);
  const priceRef = useRef<TextInput>(null);
  const stockQuantityRef = useRef<TextInput>(null);
  const [updated, setUpdated] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProductDetailsValues>({
    resolver: zodResolver(productDetailsSchema),
    defaultValues: {
      name: '',
      description: '',
      price: '',
      stockQuantity: '',
      category: '',
      photos: [],
    },
    mode: 'onSubmit',
    reValidateMode: 'onChange',
  });

  // The product list loads asynchronously, so the form is filled once its row arrives.
  useEffect(() => {
    if (product) {
      reset(toProductFormValues(product));
    }
  }, [product, reset]);

  useEffect(() => {
    if (!isLoading && !product) {
      router.replace('/(seller)/products');
    }
  }, [isLoading, product]);

  async function onSubmit(values: ProductDetailsValues) {
    if (!product) {
      return;
    }

    setFormError(null);

    const { error } = await updateProduct(product.id, toProductInput(values));

    if (error) {
      setFormError(t('editProduct.saveError'));
      return;
    }

    setUpdated(true);
  }

  const submit = handleSubmit(onSubmit, () => nameRef.current?.focus());

  if (!product) {
    return null;
  }

  return (
    <KeyboardScreen>
      <ScreenHeader title={t('editProduct.title')} className="mb-2" />

      <Text className="type-text-primary mb-8 text-secondary">
        {t('editProduct.intro', { name: product.name })}
      </Text>

      <View className="gap-5">
        <Controller
          control={control}
          name="photos"
          render={({ field }) => (
            <ProductPhotoGrid
              label={t('productForm.photos')}
              photos={field.value}
              onChange={(photos) => {
                setUpdated(false);
                field.onChange(photos);
              }}
              error={errors.photos?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="name"
          render={({ field }) => (
            <InputField
              ref={nameRef}
              label={t('productForm.name')}
              value={field.value}
              onChangeText={(text) => {
                setUpdated(false);
                field.onChange(text);
              }}
              onBlur={field.onBlur}
              error={errors.name?.message}
              isRequired
              autoCapitalize="words"
              returnKeyType="next"
              onSubmitEditing={() => descriptionRef.current?.focus()}
            />
          )}
        />

        <Controller
          control={control}
          name="description"
          render={({ field }) => (
            <InputField
              ref={descriptionRef}
              label={t('product.description')}
              value={field.value}
              onChangeText={(text) => {
                setUpdated(false);
                field.onChange(text);
              }}
              onBlur={field.onBlur}
              error={errors.description?.message}
              isRequired
              returnKeyType="next"
              onSubmitEditing={() => priceRef.current?.focus()}
            />
          )}
        />

        <View className="flex-row gap-4">
          <Controller
            control={control}
            name="price"
            render={({ field }) => (
              <InputField
                ref={priceRef}
                label={t('productForm.price')}
                value={field.value}
                onChangeText={(text) => {
                  setUpdated(false);
                  field.onChange(text);
                }}
                onBlur={field.onBlur}
                error={errors.price?.message}
                isRequired
                isMicVisible={false}
                keyboardType="decimal-pad"
                returnKeyType="next"
                onSubmitEditing={() => stockQuantityRef.current?.focus()}
                width="half"
              />
            )}
          />

          <Controller
            control={control}
            name="stockQuantity"
            render={({ field }) => (
              <InputField
                ref={stockQuantityRef}
                label={t('productForm.stockQuantity')}
                value={field.value}
                onChangeText={(text) => {
                  setUpdated(false);
                  field.onChange(text);
                }}
                onBlur={field.onBlur}
                error={errors.stockQuantity?.message}
                isRequired
                isMicVisible={false}
                keyboardType="number-pad"
                returnKeyType="done"
                onSubmitEditing={submit}
                width="half"
              />
            )}
          />
        </View>

        <Controller
          control={control}
          name="category"
          render={({ field }) => (
            <ChipSelect
              label={t('productForm.category')}
              options={productCategories}
              formatOption={translateOption}
              value={field.value}
              onChange={(value) => {
                setUpdated(false);
                field.onChange(value);
              }}
              error={errors.category?.message}
              required
            />
          )}
        />

        <FormError message={formError} />

        <SuccessBanner message={updated ? t('editProduct.saved') : null} />

        <Button label={t('common.saveChanges')} loading={isSubmitting} onPress={submit} />
      </View>
    </KeyboardScreen>
  );
}
