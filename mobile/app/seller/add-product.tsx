import { zodResolver } from '@hookform/resolvers/zod';
import { useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Text, TextInput, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { ChipSelect } from '@/components/ui/ChipSelect';
import { ImagePickerField } from '@/components/ui/ImagePickerField';
import { KeyboardScreen } from '@/components/ui/KeyboardScreen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { SuccessBanner } from '@/components/ui/SuccessBanner';
import { InputField } from '@/components/ui/InputField';
import {
  productCategories,
  productDetailsSchema,
  type ProductDetailsValues,
} from '@/lib/sellerSchemas';

export default function AddProductScreen() {
  const nameRef = useRef<TextInput>(null);
  const descriptionRef = useRef<TextInput>(null);
  const priceRef = useRef<TextInput>(null);
  const stockQuantityRef = useRef<TextInput>(null);
  const [added, setAdded] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProductDetailsValues>({
    resolver: zodResolver(productDetailsSchema),
    defaultValues: {
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

  // UI-only for now: a real submit will POST to the backend once that exists.
  function onSubmit(_values: ProductDetailsValues) {
    setAdded(true);
  }

  const submit = handleSubmit(onSubmit, () => nameRef.current?.focus());

  return (
    <KeyboardScreen>
      <ScreenHeader title="Add a product" className="mb-2" />

      <Text className="type-text-primary mb-8 text-secondary">
        Give buyers the details they need to make a purchase.
      </Text>

      <View className="gap-5">
        <Controller
          control={control}
          name="imageUri"
          render={({ field }) => (
            <ImagePickerField
              label="Product photo"
              imageUri={field.value || null}
              onChange={(uri) => field.onChange(uri ?? '')}
              error={errors.imageUri?.message}
              required
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
              placeholder="e.g. Ridge Shell Jacket"
              value={field.value}
              onChangeText={field.onChange}
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
              placeholder="Describe the fit, material, and details"
              value={field.value}
              onChangeText={field.onChange}
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
                placeholder="0.00"
                value={field.value}
                onChangeText={field.onChange}
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
                placeholder="0"
                value={field.value}
                onChangeText={field.onChange}
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
              onChange={field.onChange}
              error={errors.category?.message}
              required
            />
          )}
        />

        <SuccessBanner message={added ? 'Product ready for review this session.' : null} />

        <Button label="Add product" loading={isSubmitting} onPress={submit} />
      </View>
    </KeyboardScreen>
  );
}
