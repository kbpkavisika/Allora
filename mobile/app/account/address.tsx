import { zodResolver } from '@hookform/resolvers/zod';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Alert, Text, TextInput, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { FormError } from '@/components/ui/FormError';
import { InputField } from '@/components/ui/InputField';
import { KeyboardScreen } from '@/components/ui/KeyboardScreen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Toggle } from '@/components/ui/Toggle';
import { useProfile } from '@/hooks/useProfile';
import { addressSchema, type AddressValues } from '@/lib/schemas';

export default function AddressFormScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { addresses, saveAddress, deleteAddress } = useProfile();
  const existing = id ? addresses.find((address) => address.id === id) : undefined;
  const [formError, setFormError] = useState<string | null>(null);

  const lineTwoRef = useRef<TextInput>(null);
  const cityRef = useRef<TextInput>(null);
  const regionRef = useRef<TextInput>(null);
  const postalRef = useRef<TextInput>(null);
  const countryRef = useRef<TextInput>(null);
  const noteRef = useRef<TextInput>(null);

  const values = useMemo<AddressValues>(
    () => ({
      label: existing?.label ?? '',
      line1: existing?.line1 ?? '',
      line2: existing?.line2 ?? '',
      city: existing?.city ?? '',
      region: existing?.region ?? '',
      postalCode: existing?.postal_code ?? '',
      country: existing?.country ?? 'Canada',
      deliveryNote: existing?.delivery_note ?? '',
      isDefault: existing?.is_default ?? false,
    }),
    [existing]
  );

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AddressValues>({
    resolver: zodResolver(addressSchema),
    values,
    defaultValues: values,
    mode: 'onSubmit',
    reValidateMode: 'onChange',
  });

  async function onSubmit(formValues: AddressValues) {
    setFormError(null);

    const { error } = await saveAddress(
      {
        label: formValues.label,
        line1: formValues.line1,
        line2: formValues.line2 || null,
        city: formValues.city,
        region: formValues.region,
        postal_code: formValues.postalCode,
        country: formValues.country,
        delivery_note: formValues.deliveryNote || null,
        is_default: formValues.isDefault,
      },
      existing?.id
    );

    if (error) {
      setFormError('Could not save this address. Try again.');
      return;
    }

    router.back();
  }

  const submit = handleSubmit(onSubmit);

  function confirmDelete() {
    if (!existing) return;

    Alert.alert('Remove address', `Remove ${existing.label}? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          await deleteAddress(existing.id);
          router.back();
        },
      },
    ]);
  }

  return (
    <KeyboardScreen>
      <ScreenHeader title={existing ? 'Edit address' : 'Add address'} className="mb-8" />

      <View className="gap-5">
        <Controller
          control={control}
          name="label"
          render={({ field }) => (
            <InputField
              label="Label"
              placeholder="Home, Work..."
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              error={errors.label?.message}
              returnKeyType="next"
              submitBehavior="submit"
            />
          )}
        />

        <Controller
          control={control}
          name="line1"
          render={({ field }) => (
            <InputField
              label="Street address"
              placeholder="1180 Homer Street"
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              error={errors.line1?.message}
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
              label="Apt, suite (optional)"
              placeholder="Apt 704"
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

        <View className="flex-row gap-3">
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
                returnKeyType="next"
                submitBehavior="submit"
                onSubmitEditing={() => regionRef.current?.focus()}
              />
            )}
          />
          <Controller
            control={control}
            name="region"
            render={({ field }) => (
              <InputField
                ref={regionRef}
                label="Province"
                placeholder="BC"
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                error={errors.region?.message}
                width="half"
                returnKeyType="next"
                submitBehavior="submit"
                onSubmitEditing={() => postalRef.current?.focus()}
              />
            )}
          />
        </View>

        <View className="flex-row gap-3">
          <Controller
            control={control}
            name="postalCode"
            render={({ field }) => (
              <InputField
                ref={postalRef}
                label="Postal code"
                placeholder="V6B 1A1"
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                error={errors.postalCode?.message}
                width="half"
                autoCapitalize="characters"
                returnKeyType="next"
                submitBehavior="submit"
                onSubmitEditing={() => countryRef.current?.focus()}
              />
            )}
          />
          <Controller
            control={control}
            name="country"
            render={({ field }) => (
              <InputField
                ref={countryRef}
                label="Country"
                placeholder="Canada"
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                error={errors.country?.message}
                width="half"
                returnKeyType="next"
                submitBehavior="submit"
                onSubmitEditing={() => noteRef.current?.focus()}
              />
            )}
          />
        </View>

        <Controller
          control={control}
          name="deliveryNote"
          render={({ field }) => (
            <InputField
              ref={noteRef}
              label="Delivery note (optional)"
              placeholder="Weekday delivery only · 9am-5pm"
              value={field.value ?? ''}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              error={errors.deliveryNote?.message}
              returnKeyType="done"
              submitBehavior="blurAndSubmit"
              onSubmitEditing={submit}
            />
          )}
        />

        <Controller
          control={control}
          name="isDefault"
          render={({ field }) => (
            <View className="flex-row items-center justify-between rounded-12 border-1 border-border px-4 py-3">
              <View className="flex-1 gap-0.5">
                <Text className="type-label-lg text-primary">Set as default</Text>
                <Text className="type-text-secondary text-secondary">Used automatically at checkout</Text>
              </View>
              <Toggle label="Set as default" value={field.value} onValueChange={field.onChange} />
            </View>
          )}
        />

        <FormError message={formError} />

        <Button label={existing ? 'Save address' : 'Add address'} loading={isSubmitting} onPress={submit} />

        {existing ? (
          <Button variant="link" label="Remove address" className="self-center" onPress={confirmDelete} />
        ) : null}
      </View>
    </KeyboardScreen>
  );
}
