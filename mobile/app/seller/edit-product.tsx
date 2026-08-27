import { zodResolver } from '@hookform/resolvers/zod';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
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

export default function EditProductScreen() {
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
      router.replace('/seller/products');
    }
  }, [isLoading, product]);

  async function onSubmit(values: ProductDetailsValues) {
    if (!product) {
      return;
    }

    setFormError(null);

    const { error } = await updateProduct(product.id, toProductInput(values));

    if (error) {
      setFormError('Something went wrong saving your changes. Please try again.');
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
      <ScreenHeader title="Edit product" className="mb-2" />

      <Text className="type-text-primary mb-8 text-secondary">
        Update the details, photo, or stock for {product.name}.
      </Text>

      <View className="gap-5">
        <Controller
          control={control}
          name="photos"
          render={({ field }) => (
            <ProductPhotoGrid
              label="Product photos"
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
              label="Product name"
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
              label="Description"
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
                label="Price"
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
                label="Stock quantity"
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
              label="Category"
              options={productCategories}
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

        <SuccessBanner message={updated ? 'Changes saved.' : null} />

        <Button label="Save changes" loading={isSubmitting} onPress={submit} />
      </View>
    </KeyboardScreen>
  );
}
