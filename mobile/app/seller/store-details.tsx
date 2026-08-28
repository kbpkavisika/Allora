import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { TextInput, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Divider } from '@/components/ui/Divider';
import { FormError } from '@/components/ui/FormError';
import { ImagePickerField } from '@/components/ui/ImagePickerField';
import { InputField } from '@/components/ui/InputField';
import { KeyboardScreen } from '@/components/ui/KeyboardScreen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Select } from '@/components/ui/Select';
import { ToggleRow } from '@/components/ui/ToggleRow';
import { useShop } from '@/hooks/useShop';
import { uploadPhoto } from '@/lib/photoUpload';
import { storeSetupSchema, type StoreSetupValues } from '@/lib/sellerSchemas';
import { shopCategories } from '@/lib/shop';

export default function StoreDetailsScreen() {
  const { shop, saveShop } = useShop();
  const cityRef = useRef<TextInput>(null);
  const phoneRef = useRef<TextInput>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const values = useMemo<StoreSetupValues>(
    () => ({
      name: shop?.name ?? '',
      category: shop?.category ?? '',
      city: shop?.city ?? '',
      phone: shop?.phone ?? '',
      pickupEnabled: shop?.pickup_enabled ?? true,
      deliveryEnabled: shop?.delivery_enabled ?? false,
      photoUri: shop?.photo_url ?? '',
    }),
    [shop]
  );

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<StoreSetupValues>({
    resolver: zodResolver(storeSetupSchema),
    values,
    defaultValues: values,
    mode: 'onSubmit',
    reValidateMode: 'onChange',
  });

  async function onSubmit(formValues: StoreSetupValues) {
    setFormError(null);

    let photoUrl: string | null = null;

    if (formValues.photoUri) {
      try {
        photoUrl = await uploadPhoto(formValues.photoUri);
      } catch {
        setFormError('Could not upload your shop photo. Try again.');
        return;
      }
    }

    const { error } = await saveShop({
      name: formValues.name,
      category: formValues.category,
      city: formValues.city,
      phone: formValues.phone,
      pickup_enabled: formValues.pickupEnabled,
      delivery_enabled: formValues.deliveryEnabled,
      photo_url: photoUrl,
    });

    if (error) {
      setFormError('Could not save your changes. Try again.');
      return;
    }

    router.back();
  }

  const submit = handleSubmit(onSubmit, (invalid) => {
    if (invalid.city) cityRef.current?.focus();
    else if (invalid.phone) phoneRef.current?.focus();
  });

  return (
    <KeyboardScreen>
      <ScreenHeader title="Store details" className="mb-5" />

      <View className="gap-5">
        <Controller
          control={control}
          name="name"
          render={({ field }) => (
            <InputField
              label="Shop name"
              placeholder="e.g. Chamari's Teak Crafts"
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              error={errors.name?.message}
              isRequired
              autoCapitalize="words"
              returnKeyType="next"
              submitBehavior="submit"
              onSubmitEditing={() => cityRef.current?.focus()}
            />
          )}
        />

        <Controller
          control={control}
          name="category"
          render={({ field }) => (
            <Select
              label="What do you sell?"
              options={shopCategories}
              value={field.value}
              onChange={field.onChange}
              placeholder="Choose a category"
              error={errors.category?.message}
              required
            />
          )}
        />

        <Controller
          control={control}
          name="city"
          render={({ field }) => (
            <InputField
              ref={cityRef}
              label="Shop location"
              placeholder="Town or city"
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              error={errors.city?.message}
              isRequired
              autoCapitalize="words"
              returnKeyType="next"
              submitBehavior="submit"
              onSubmitEditing={() => phoneRef.current?.focus()}
            />
          )}
        />

        <Controller
          control={control}
          name="phone"
          render={({ field }) => (
            <InputField
              ref={phoneRef}
              label="Phone number"
              placeholder="07X XXX XXXX"
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              error={errors.phone?.message}
              isRequired
              valueVariant="mono"
              keyboardType="phone-pad"
              autoComplete="tel"
              returnKeyType="done"
            />
          )}
        />

        <Divider />

        <View className="gap-3">
          <Controller
            control={control}
            name="pickupEnabled"
            render={({ field }) => (
              <ToggleRow
                title="Enable pickup for buyers"
                description="Buyers nearby can collect orders directly"
                value={field.value}
                onValueChange={field.onChange}
              />
            )}
          />

          <Controller
            control={control}
            name="deliveryEnabled"
            render={({ field }) => (
              <ToggleRow
                title="Enable delivery"
                description="Show shipping options at checkout"
                value={field.value}
                onValueChange={field.onChange}
              />
            )}
          />
        </View>

        <FormError message={errors.pickupEnabled?.message} />

        <Divider />

        <Controller
          control={control}
          name="photoUri"
          render={({ field }) => (
            <ImagePickerField
              label="Shop photo"
              imageUri={field.value || null}
              onChange={(uri) => field.onChange(uri ?? '')}
              placeholder="Tap to take or upload a photo"
              fullWidth
              aspectRatio={4 / 3}
              allowCamera
            />
          )}
        />

        <FormError message={formError} />

        <View className="gap-3">
          <Button label="Save changes" loading={isSubmitting} onPress={submit} />
          <Button
            variant="secondary"
            label="Discard"
            onPress={() => router.back()}
            hint="Leaves without saving your changes"
          />
        </View>
      </View>
    </KeyboardScreen>
  );
}
