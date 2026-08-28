import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Pressable, Text, TextInput, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Checkbox } from '@/components/ui/Checkbox';
import { FormError } from '@/components/ui/FormError';
import { InputField } from '@/components/ui/InputField';
import { KeyboardScreen } from '@/components/ui/KeyboardScreen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Select } from '@/components/ui/Select';
import { useProfile } from '@/hooks/useProfile';
import { COUNTRY_OPTIONS, PROVINCE_OPTIONS } from '@/lib/profile';
import { shippingAddressSchema, type ShippingAddressValues } from '@/lib/schemas';

const noop = () => {};

const DELIVERY_OPTIONS = [
  { label: 'Leave at door', leaveAtDoor: true },
  { label: 'Hand to me', leaveAtDoor: false },
] as const;

export default function ShippingAddressScreen() {
  const { profile, addresses, saveAddress, updateProfile } = useProfile();
  const existing = addresses.find((address) => address.is_default) ?? addresses[0];
  const [formError, setFormError] = useState<string | null>(null);

  const lineTwoRef = useRef<TextInput>(null);
  const cityRef = useRef<TextInput>(null);
  const postalRef = useRef<TextInput>(null);

  const values = useMemo<ShippingAddressValues>(
    () => ({
      line1: existing?.line1 ?? '',
      line2: existing?.line2 ?? '',
      city: existing?.city ?? '',
      region: existing?.region ?? '',
      postalCode: existing?.postal_code ?? '',
      country: existing?.country ?? 'Canada',
      leaveAtDoor: profile?.leave_at_door_default ?? false,
    }),
    [existing, profile]
  );

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ShippingAddressValues>({
    resolver: zodResolver(shippingAddressSchema),
    values,
    defaultValues: values,
    mode: 'onSubmit',
    reValidateMode: 'onChange',
  });

  async function onSubmit(formValues: ShippingAddressValues) {
    setFormError(null);

    const { error: addressError } = await saveAddress(
      {
        label: existing?.label ?? 'Home',
        line1: formValues.line1,
        line2: formValues.line2 || null,
        city: formValues.city,
        region: formValues.region,
        postal_code: formValues.postalCode,
        country: formValues.country,
        delivery_note: existing?.delivery_note ?? null,
        is_default: existing?.is_default ?? true,
      },
      existing?.id
    );

    if (addressError) {
      setFormError('Could not save this address. Try again.');
      return;
    }

    const { error: profileError } = await updateProfile({
      leave_at_door_default: formValues.leaveAtDoor,
    });

    if (profileError) {
      setFormError('Could not save this address. Try again.');
      return;
    }

    router.back();
  }

  const submit = handleSubmit(onSubmit, (invalid) => {
    if (invalid.postalCode) postalRef.current?.focus();
  });

  return (
    <KeyboardScreen>
      <ScreenHeader title="Shipping address" className="mb-5" />

      <View className="gap-4">
        <Controller
          control={control}
          name="line1"
          render={({ field }) => (
            <InputField
              label="Street address"
              isRequired
              placeholder="1180 Cedar Street"
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              error={errors.line1?.message}
              autoComplete="street-address"
              returnKeyType="next"
              submitBehavior="submit"
              onSubmitEditing={() => lineTwoRef.current?.focus()}
            />
          )}
        />

        <Controller
          control={control}
          name="line2"
          render={({ field }) => (
            <InputField
              ref={lineTwoRef}
              label="Apartment or unit"
              placeholder="Apt 4"
              value={field.value ?? ''}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              error={errors.line2?.message}
              returnKeyType="next"
              submitBehavior="submit"
              onSubmitEditing={() => cityRef.current?.focus()}
            />
          )}
        />

        <View className="flex-row items-start gap-3">
          <Controller
            control={control}
            name="city"
            render={({ field }) => (
              <InputField
                ref={cityRef}
                label="City"
                placeholder="Vancouver"
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                error={errors.city?.message}
                width="half"
                isMicVisible={false}
                returnKeyType="next"
                submitBehavior="submit"
                onSubmitEditing={() => postalRef.current?.focus()}
              />
            )}
          />
          <Controller
            control={control}
            name="region"
            render={({ field }) => (
              <Select
                label="Province"
                options={PROVINCE_OPTIONS}
                value={field.value}
                onChange={field.onChange}
                placeholder="BC"
                error={errors.region?.message}
                className="w-[118px]"
              />
            )}
          />
        </View>

        <Controller
          control={control}
          name="postalCode"
          render={({ field }) => (
            <InputField
              ref={postalRef}
              label="Postal code"
              isRequired
              placeholder="V5T 2H9"
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              error={errors.postalCode?.message}
              valueVariant="mono"
              autoCapitalize="characters"
              autoComplete="postal-code"
              returnKeyType="done"
              submitBehavior="blurAndSubmit"
            />
          )}
        />

        <Controller
          control={control}
          name="country"
          render={({ field }) => (
            <Select
              label="Country"
              options={COUNTRY_OPTIONS}
              value={field.value}
              onChange={field.onChange}
              placeholder="Canada"
              error={errors.country?.message}
            />
          )}
        />
      </View>

      <View className="mt-8 gap-3">
        <SectionHeader title="Delivery preference" />

        <Controller
          control={control}
          name="leaveAtDoor"
          render={({ field }) => (
            <Card>
              <View role="radiogroup" aria-label="Delivery preference">
                {DELIVERY_OPTIONS.map((option, index) => {
                  const selected = field.value === option.leaveAtDoor;

                  return (
                    <Pressable
                      key={option.label}
                      onPress={() => field.onChange(option.leaveAtDoor)}
                      role="radio"
                      aria-checked={selected}
                      aria-label={option.label}
                      className={`min-h-control-lg flex-row items-center justify-between gap-3 px-4 py-3 active:bg-surface-muted ${
                        index < DELIVERY_OPTIONS.length - 1 ? 'border-b-1 border-border' : ''
                      }`}>
                      <Text className="type-text-primary text-primary">{option.label}</Text>
                      <View pointerEvents="none" aria-hidden>
                        <Checkbox checked={selected} onChange={noop} label={option.label} />
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            </Card>
          )}
        />
      </View>

      <View className="mt-5 gap-3">
        <FormError message={formError} />
        <Button label="Save address" loading={isSubmitting} onPress={submit} />
      </View>
    </KeyboardScreen>
  );
}
