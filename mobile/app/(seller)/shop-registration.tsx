import { zodResolver } from '@hookform/resolvers/zod';
import { useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Text, TextInput, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { KeyboardScreen } from '@/components/ui/KeyboardScreen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { SuccessBanner } from '@/components/ui/SuccessBanner';
import { TextField } from '@/components/ui/TextField';
import { shopRegistrationSchema, type ShopRegistrationValues } from '@/lib/sellerSchemas';

export default function ShopRegistrationScreen() {
  const shopNameRef = useRef<TextInput>(null);
  const descriptionRef = useRef<TextInput>(null);
  const contactEmailRef = useRef<TextInput>(null);
  const contactPhoneRef = useRef<TextInput>(null);
  const addressRef = useRef<TextInput>(null);
  const [registered, setRegistered] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ShopRegistrationValues>({
    resolver: zodResolver(shopRegistrationSchema),
    defaultValues: {
      shopName: '',
      description: '',
      contactEmail: '',
      contactPhone: '',
      address: '',
    },
    mode: 'onSubmit',
    reValidateMode: 'onChange',
  });

  // UI-only for now: a real submit will POST to the backend once that exists.
  function onSubmit(_values: ShopRegistrationValues) {
    setRegistered(true);
  }

  const submit = handleSubmit(onSubmit, () => shopNameRef.current?.focus());

  return (
    <KeyboardScreen>
      <ScreenHeader title="Register your shop" className="mb-2" />

      <Text className="type-text-primary mb-8 text-secondary">
        Tell buyers who you are. You can edit these details later.
      </Text>

      <View className="gap-5">
        <Controller
          control={control}
          name="shopName"
          render={({ field }) => (
            <TextField
              ref={shopNameRef}
              label="Shop name"
              placeholder="e.g. Ridge & Co."
              value={field.value}
              onChangeText={(text) => {
                setRegistered(false);
                field.onChange(text);
              }}
              onBlur={field.onBlur}
              error={errors.shopName?.message}
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
              placeholder="Tell buyers what your shop sells"
              value={field.value}
              onChangeText={(text) => {
                setRegistered(false);
                field.onChange(text);
              }}
              onBlur={field.onBlur}
              error={errors.description?.message}
              required
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              returnKeyType="next"
              onSubmitEditing={() => contactEmailRef.current?.focus()}
            />
          )}
        />

        <Controller
          control={control}
          name="contactEmail"
          render={({ field }) => (
            <TextField
              ref={contactEmailRef}
              label="Contact email"
              placeholder="hello@yourshop.com"
              value={field.value}
              onChangeText={(text) => {
                setRegistered(false);
                field.onChange(text);
              }}
              onBlur={field.onBlur}
              error={errors.contactEmail?.message}
              required
              keyboardType="email-address"
              textContentType="emailAddress"
              autoComplete="email"
              autoCapitalize="none"
              autoCorrect={false}
              spellCheck={false}
              returnKeyType="next"
              onSubmitEditing={() => contactPhoneRef.current?.focus()}
            />
          )}
        />

        <Controller
          control={control}
          name="contactPhone"
          render={({ field }) => (
            <TextField
              ref={contactPhoneRef}
              label="Contact phone"
              placeholder="+1 555 010 1234"
              value={field.value}
              onChangeText={(text) => {
                setRegistered(false);
                field.onChange(text);
              }}
              onBlur={field.onBlur}
              error={errors.contactPhone?.message}
              required
              keyboardType="phone-pad"
              textContentType="telephoneNumber"
              autoComplete="tel"
              returnKeyType="next"
              onSubmitEditing={() => addressRef.current?.focus()}
            />
          )}
        />

        <Controller
          control={control}
          name="address"
          render={({ field }) => (
            <TextField
              ref={addressRef}
              label="Business address"
              placeholder="123 Market St, Springfield"
              value={field.value ?? ''}
              onChangeText={(text) => {
                setRegistered(false);
                field.onChange(text);
              }}
              onBlur={field.onBlur}
              error={errors.address?.message}
              returnKeyType="done"
              onSubmitEditing={submit}
            />
          )}
        />

        <SuccessBanner message={registered ? 'Shop details saved for this session.' : null} />

        <Button label="Register shop" loading={isSubmitting} onPress={submit} />
      </View>
    </KeyboardScreen>
  );
}
