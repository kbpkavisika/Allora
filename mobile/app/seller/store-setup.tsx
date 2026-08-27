import { zodResolver } from '@hookform/resolvers/zod';
import { useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Text, TextInput, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Callout } from '@/components/ui/Callout';
import { FormError } from '@/components/ui/FormError';
import { Icon } from '@/components/ui/Icon';
import { IconButton } from '@/components/ui/IconButton';
import { InputField } from '@/components/ui/InputField';
import { KeyboardScreen } from '@/components/ui/KeyboardScreen';
import { Select } from '@/components/ui/Select';
import { StepProgress } from '@/components/ui/StepProgress';
import { ToggleRow } from '@/components/ui/ToggleRow';
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
  const [step, setStep] = useState(1);
  const [formError, setFormError] = useState<string | null>(null);

  const phoneRef = useRef<TextInput>(null);

  const {
    control,
    trigger,
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

  const meta = STEP_META[step - 1];

  return (
    <KeyboardScreen>
      {step > 1 ? (
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
                isMicVisible={false}
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

      {step === 3 || step === 4 ? (
        <View className="gap-5">
          <Text className="type-text-primary text-secondary">
            Step {step} is wired next.
          </Text>
          <View className="flex-row gap-3">
            <View className="flex-1">
              <Button variant="secondary" label="Back" onPress={goBack} />
            </View>
          </View>
        </View>
      ) : null}
    </KeyboardScreen>
  );
}
