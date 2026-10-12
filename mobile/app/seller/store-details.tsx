import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
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
import { translateOption } from '@/lib/i18n';

export default function StoreDetailsScreen() {
  const { t } = useTranslation();
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
        setFormError(t('store.uploadError'));
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
      setFormError(t('editProfile.saveError'));
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
      <ScreenHeader title={t('account.seller.storeDetails')} className="mb-5" />

      <View className="gap-5">
        <Controller
          control={control}
          name="name"
          render={({ field }) => (
            <InputField
              label={t('store.name')}
              placeholder={t('store.namePlaceholder')}
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
              label={t('store.category')}
              options={shopCategories}
              formatOption={translateOption}
              value={field.value}
              onChange={field.onChange}
              placeholder={t('store.categoryPlaceholder')}
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
              label={t('store.location')}
              placeholder={t('store.locationPlaceholder')}
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
              label={t('store.phone')}
              placeholder={t('store.phonePlaceholder')}
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
                title={t('store.pickupTitle')}
                description={t('store.pickupDescription')}
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
                title={t('store.deliveryTitle')}
                description={t('store.deliveryDescription')}
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
              label={t('store.photo')}
              imageUri={field.value || null}
              onChange={(uri) => field.onChange(uri ?? '')}
              placeholder={t('store.photoPlaceholder')}
              fullWidth
              aspectRatio={4 / 3}
              allowCamera
            />
          )}
        />

        <FormError message={formError} />

        <View className="gap-3">
          <Button label={t('common.saveChanges')} loading={isSubmitting} onPress={submit} />
          <Button
            variant="secondary"
            label={t('common.discard')}
            onPress={() => router.back()}
            hint={t('common.discardHint')}
          />
        </View>
      </View>
    </KeyboardScreen>
  );
}
