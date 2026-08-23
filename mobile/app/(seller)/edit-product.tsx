import { zodResolver } from '@hookform/resolvers/zod';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Text, TextInput, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { ChipSelect } from '@/components/ui/ChipSelect';
import { ImagePickerField } from '@/components/ui/ImagePickerField';
import { KeyboardScreen } from '@/components/ui/KeyboardScreen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { SuccessBanner } from '@/components/ui/SuccessBanner';
import { TextField } from '@/components/ui/TextField';
import { mockSellerProducts } from '@/lib/mockProducts';
import {
  productCategories,
  productDetailsSchema,
  type ProductDetailsValues,
} from '@/lib/sellerSchemas';

export default function EditProductScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const product = mockSellerProducts.find((item) => item.id === id);

  const nameRef = useRef<TextInput>(null);
  const descriptionRef = useRef<TextInput>(null);
  const priceRef = useRef<TextInput>(null);
  const stockQuantityRef = useRef<TextInput>(null);
  const [updated, setUpdated] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProductDetailsValues>({
    resolver: zodResolver(productDetailsSchema),
    defaultValues: product ?? {
      name: '',
      description: '',
      price: '',
      stockQuantity: '',
      category: '',
      imageUri: '',
    },
    mode: 'onSubmit',
    reValidateMode: 'onChange',
  });

  useEffect(() => {
    if (!product) {
      router.replace('/products');
    }
  }, [product]);

  // UI-only for now: a real submit will PATCH the backend once that exists.
  function onSubmit(_values: ProductDetailsValues) {
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
          name="imageUri"
          render={({ field }) => (
            <ImagePickerField
              label="Product photo"
              imageUri={field.value || null}
              onChange={(uri) => {
                setUpdated(false);
                field.onChange(uri ?? '');
              }}
              error={errors.imageUri?.message}
              required
            />
          )}
        />

        <Controller
          control={control}
          name="name"
          render={({ field }) => (
            <TextField
              ref={nameRef}
              label="Product name"
              value={field.value}
              onChangeText={(text) => {
                setUpdated(false);
                field.onChange(text);
              }}
              onBlur={field.onBlur}
              error={errors.name?.message}
              required
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
            <TextField
              ref={descriptionRef}
              label="Description"
              value={field.value}
              onChangeText={(text) => {
                setUpdated(false);
                field.onChange(text);
              }}
              onBlur={field.onBlur}
              error={errors.description?.message}
              required
              multiline
              numberOfLines={4}
              textAlignVertical="top"
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
              <TextField
                ref={priceRef}
                label="Price"
                value={field.value}
                onChangeText={(text) => {
                  setUpdated(false);
                  field.onChange(text);
                }}
                onBlur={field.onBlur}
                error={errors.price?.message}
                required
                showMic={false}
                keyboardType="decimal-pad"
                returnKeyType="next"
                onSubmitEditing={() => stockQuantityRef.current?.focus()}
                containerClassName="flex-1"
              />
            )}
          />

          <Controller
            control={control}
            name="stockQuantity"
            render={({ field }) => (
              <TextField
                ref={stockQuantityRef}
                label="Stock quantity"
                value={field.value}
                onChangeText={(text) => {
                  setUpdated(false);
                  field.onChange(text);
                }}
                onBlur={field.onBlur}
                error={errors.stockQuantity?.message}
                required
                showMic={false}
                keyboardType="number-pad"
                returnKeyType="done"
                onSubmitEditing={submit}
                containerClassName="flex-1"
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

        <SuccessBanner message={updated ? 'Changes saved for this session.' : null} />

        <Button label="Save changes" loading={isSubmitting} onPress={submit} />
      </View>
    </KeyboardScreen>
  );
}
