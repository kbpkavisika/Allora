import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
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
import { supabase } from '@/lib/supabase';
import { shopCategories } from '@/lib/shop';
import { storeSetupSchema, storeSetupStepFields, type StoreSetupValues } from '@/lib/sellerSchemas';

const TOTAL_STEPS = 4;

const STEP_META = [
  {
    title: "What's your shop called?",
    description: 'This is the name buyers see on your storefront.',
  },
  {
    title: 'Where can buyers find you?',
    description: 'Used for pickup, delivery estimates and order calls.',
  },
  {
    title: 'Add a shop photo',
    description: 'A clear photo builds trust — your stall, workshop, or a shot of you at work.',
  },
  {
    title: 'Your shop is live!',
    description: '',
  },
];

export default function StoreSetupScreen() {
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
      setFormError('Something went wrong creating your shop. Please try again.');
      return;
    }

    setStep(TOTAL_STEPS);
  }

  function goToShop() {
    router.replace('/(seller)');
  }

  function confirmSignOut() {
    Alert.alert('Sign out', 'You will need to sign in again to finish setting up your shop.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: () => supabase.auth.signOut() },
    ]);
  }

  function addFirstProduct() {
    router.replace('/(seller)');
    router.push('/seller/add-product');
  }

  const meta = STEP_META[step - 1];

  return (
    <KeyboardScreen>
      {step > 1 && step < TOTAL_STEPS ? (
        <IconButton
          variant="outlined"
          diameter={44}
          icon={<Icon name="back" size="lg" className="text-primary" />}
          label="Go back"
          hint="Returns to the previous step"
          onPress={goBack}
          className="mb-6"
        />
      ) : null}

      <StepProgress current={step} total={TOTAL_STEPS} />

      <Text className="type-text-secondary mt-3 text-secondary" maxFontSizeMultiplier={2}>
        Setting up your shop · Step {step} of {TOTAL_STEPS}
      </Text>

      {step < TOTAL_STEPS ? (
        <View className="mb-8 mt-2 gap-2">
          <Text role="heading" className="type-h1 text-primary" maxFontSizeMultiplier={1.5}>
            {meta.title}
          </Text>
          {meta.description ? (
            <Text className="type-text-primary text-secondary" maxFontSizeMultiplier={1.5}>
              {meta.description}
            </Text>
          ) : null}
        </View>
      ) : null}

      {step === 1 ? (
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
                returnKeyType="done"
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

          <Callout message="Pick the category buyers browse most — you can list in more than one category later." />

          <Button label="Continue" onPress={goNext} />
        </View>
      ) : null}

      {step === 2 ? (
        <View className="gap-5">
          <Controller
            control={control}
            name="city"
            render={({ field }) => (
              <InputField
                label="Shop location"
                placeholder="Town or city"
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
                label="Phone number"
                placeholder="07X XXX XXXX"
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

          <FormError message={errors.pickupEnabled?.message ?? formError} />

          <View className="flex-row gap-3">
            <View className="flex-1">
              <Button variant="secondary" label="Back" onPress={goBack} />
            </View>
            <View className="flex-1">
              <Button label="Continue" onPress={goNext} />
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

          <Callout
            tone="warning"
            message="Tip: natural light and a tidy background make your shop feel trustworthy."
          />

          <FormError message={formError} />

          <View className="flex-row gap-3">
            <View className="flex-1">
              <Button
                variant="secondary"
                label="Skip for now"
                loading={isSaving}
                onPress={() => finishSetup(true)}
              />
            </View>
            <View className="flex-1">
              <Button label="Continue" loading={isSaving} onPress={() => finishSetup(false)} />
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
              Your shop is live!
            </Text>
            <Text
              className="type-text-primary text-center text-secondary"
              maxFontSizeMultiplier={1.5}>
              Buyers can find {getValues('name')} now
            </Text>
          </View>

          <View className="w-full gap-3 rounded-12 border-1 border-border bg-surface p-5">
            <View className="flex-row items-center gap-3">
              <Icon name="shop" size="lg" className="text-secondary" />
              <View className="flex-1 gap-0.5">
                <Text className="type-h3 text-primary" numberOfLines={1}>
                  {getValues('name')}
                </Text>
                <Text className="type-text-secondary text-secondary">{getValues('category')}</Text>
              </View>
            </View>

            <View className="h-px bg-border" />

            <Text className="type-text-secondary text-secondary">
              {getValues('city')} ·{' '}
              {getValues('pickupEnabled')
                ? 'Pickup enabled'
                : getValues('deliveryEnabled')
                  ? 'Delivery enabled'
                  : 'Contact for orders'}
            </Text>
          </View>

          <View className="w-full gap-3">
            <Button label="Add your first product" onPress={addFirstProduct} />
            <Button variant="secondary" label="Go to My shop" onPress={goToShop} />
          </View>
        </View>
      ) : null}

      {step < TOTAL_STEPS ? (
        <Button
          variant="link"
          label="Not your account? Sign out"
          className="mt-8 self-center"
          onPress={confirmSignOut}
        />
      ) : null}
    </KeyboardScreen>
  );
}
