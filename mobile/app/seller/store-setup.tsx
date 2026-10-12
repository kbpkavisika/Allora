import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Alert, Text, TextInput, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Callout } from '@/components/ui/Callout';
import { FormError } from '@/components/ui/FormError';
import { Icon } from '@/components/ui/Icon';
import { IconButton } from '@/components/ui/IconButton';
import { ImagePickerField } from '@/components/ui/ImagePickerField';
import { InputField } from '@/components/ui/InputField';
import { KeyboardScreen } from '@/components/ui/KeyboardScreen';
import { Select } from '@/components/ui/Select';
import { StepProgress } from '@/components/ui/StepProgress';
import { ToggleRow } from '@/components/ui/ToggleRow';
import { useShop } from '@/hooks/useShop';
import { signOut } from '@/lib/AuthProvider';
import { shopCategories } from '@/lib/shop';
import { storeSetupSchema, storeSetupStepFields, type StoreSetupValues } from '@/lib/sellerSchemas';
import { translateOption } from '@/lib/i18n';

const TOTAL_STEPS = 4;

export default function StoreSetupScreen() {
  const { t } = useTranslation();
  const { saveShop } = useShop();
  const [step, setStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const phoneRef = useRef<TextInput>(null);

  const {
    control,
    trigger,
    getValues,
    formState: { errors },
  } = useForm<StoreSetupValues>({
    resolver: zodResolver(storeSetupSchema),
    defaultValues: {
      name: '',
      category: '',
      city: '',
      phone: '',
      pickupEnabled: true,
      deliveryEnabled: false,
      photoUri: '',
    },
    mode: 'onSubmit',
    reValidateMode: 'onChange',
  });

  async function goNext() {
    setFormError(null);
    const valid = await trigger(storeSetupStepFields[step - 1]);
    if (!valid) return;
    setStep((current) => Math.min(TOTAL_STEPS, current + 1));
  }

  function goBack() {
    setFormError(null);
    setStep((current) => Math.max(1, current - 1));
  }

  async function finishSetup(skipPhoto: boolean) {
    setFormError(null);
    setIsSaving(true);

    const values = getValues();
    const photoUri = skipPhoto ? '' : values.photoUri ?? '';

    const { error } = await saveShop({
      name: values.name,
      category: values.category,
      city: values.city,
      phone: values.phone,
      pickup_enabled: values.pickupEnabled,
      delivery_enabled: values.deliveryEnabled,
      photo_url: photoUri || null,
    });

    setIsSaving(false);

    if (error) {
      setFormError(t('storeSetup.createError'));
      return;
    }

    setStep(TOTAL_STEPS);
  }

  function goToShop() {
    router.replace('/(seller)');
  }

  function confirmSignOut() {
    Alert.alert(t('account.signOut'), t('storeSetup.signOutBody'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('account.signOut'), style: 'destructive', onPress: () => signOut() },
    ]);
  }

  function addFirstProduct() {
    router.replace('/(seller)');
    router.push('/seller/add-product');
  }

  return (
    <KeyboardScreen>
      {step > 1 && step < TOTAL_STEPS ? (
        <IconButton
          variant="outlined"
          diameter={44}
          icon={<Icon name="back" size="lg" className="text-primary" />}
          label={t('common.goBack')}
          hint={t('common.previousStepHint')}
          onPress={goBack}
          className="mb-6"
        />
      ) : null}

      <StepProgress current={step} total={TOTAL_STEPS} />

      <Text className="type-text-secondary mt-3 text-secondary" maxFontSizeMultiplier={2}>
        {t('storeSetup.progress', { current: step, total: TOTAL_STEPS })}
      </Text>

      {step < TOTAL_STEPS ? (
        <View className="mb-8 mt-2 gap-2">
          <Text role="heading" className="type-h1 text-primary" maxFontSizeMultiplier={1.5}>
            {t(`storeSetup.steps.${step}.title`)}
          </Text>
          <Text className="type-text-primary text-secondary" maxFontSizeMultiplier={1.5}>
            {t(`storeSetup.steps.${step}.description`)}
          </Text>
        </View>
      ) : null}

      {step === 1 ? (
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
                returnKeyType="done"
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

          <Callout message={t('storeSetup.categoryTip')} />

          <Button label={t('common.continue')} onPress={goNext} />
        </View>
      ) : null}

      {step === 2 ? (
        <View className="gap-5">
          <Controller
            control={control}
            name="city"
            render={({ field }) => (
              <InputField
                label={t('store.location')}
                placeholder={t('store.locationPlaceholder')}
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                error={errors.city?.message}
                isRequired
                autoCapitalize="words"
                returnKeyType="next"
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
                keyboardType="phone-pad"
                textContentType="telephoneNumber"
                autoComplete="tel"
                returnKeyType="done"
              />
            )}
          />

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

          <FormError message={errors.pickupEnabled?.message ?? formError} />

          <View className="flex-row gap-3">
            <View className="flex-1">
              <Button variant="secondary" label={t('common.back')} onPress={goBack} />
            </View>
            <View className="flex-1">
              <Button label={t('common.continue')} onPress={goNext} />
            </View>
          </View>
        </View>
      ) : null}

      {step === 3 ? (
        <View className="gap-5">
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

          <Callout
            tone="warning"
            message={t('storeSetup.photoTip')}
          />

          <FormError message={formError} />

          <View className="flex-row gap-3">
            <View className="flex-1">
              <Button
                variant="secondary"
                label={t('onboarding.personalize.skip')}
                loading={isSaving}
                onPress={() => finishSetup(true)}
              />
            </View>
            <View className="flex-1">
              <Button label={t('common.continue')} loading={isSaving} onPress={() => finishSetup(false)} />
            </View>
          </View>
        </View>
      ) : null}

      {step === 4 ? (
        <View className="items-center gap-6 pt-6">
          <View className="h-16 w-16 items-center justify-center rounded-full border-1 border-success bg-success-tint">
            <Icon name="check" size="lg" className="text-success" />
          </View>

          <View className="items-center gap-2">
            <Text
              role="heading"
              className="type-h1 text-center text-primary"
              maxFontSizeMultiplier={1.5}>
              {t('storeSetup.liveTitle')}
            </Text>
            <Text
              className="type-text-primary text-center text-secondary"
              maxFontSizeMultiplier={1.5}>
              {t('storeSetup.liveBody', { name: getValues('name') })}
            </Text>
          </View>

          <View className="w-full gap-3 rounded-12 border-1 border-border bg-surface p-5">
            <View className="flex-row items-center gap-3">
              <Icon name="shop" size="lg" className="text-secondary" />
              <View className="flex-1 gap-0.5">
                <Text className="type-h3 text-primary" numberOfLines={1}>
                  {getValues('name')}
                </Text>
                <Text className="type-text-secondary text-secondary">{translateOption(getValues('category'))}</Text>
              </View>
            </View>

            <View className="h-px bg-border" />

            <Text className="type-text-secondary text-secondary">
              {getValues('city')} ·{' '}
              {getValues('pickupEnabled')
                ? t('storeSetup.pickupEnabled')
                : getValues('deliveryEnabled')
                  ? t('storeSetup.deliveryEnabled')
                  : t('storeSetup.contactForOrders')}
            </Text>
          </View>

          <View className="w-full gap-3">
            <Button label={t('storeSetup.addFirstProduct')} onPress={addFirstProduct} />
            <Button variant="secondary" label={t('storeSetup.goToShop')} onPress={goToShop} />
          </View>
        </View>
      ) : null}

      {step < TOTAL_STEPS ? (
        <Button
          variant="link"
          label={t('storeSetup.notYourAccount')}
          className="mt-8 self-center"
          onPress={confirmSignOut}
        />
      ) : null}
    </KeyboardScreen>
  );
}
