import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { TextInput, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { FormError } from '@/components/ui/FormError';
import { InputField } from '@/components/ui/InputField';
import { KeyboardScreen } from '@/components/ui/KeyboardScreen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { useProfile } from '@/hooks/useProfile';
import { profileSchema, type ProfileValues } from '@/lib/schemas';

export default function EditProfileScreen() {
  const { profile, updateProfile } = useProfile();
  const phoneRef = useRef<TextInput>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const values = useMemo<ProfileValues>(
    () => ({ fullName: profile?.full_name ?? '', phone: profile?.phone ?? '' }),
    [profile]
  );

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    values,
    defaultValues: { fullName: '', phone: '' },
    mode: 'onSubmit',
    reValidateMode: 'onChange',
  });

  async function onSubmit(formValues: ProfileValues) {
    setFormError(null);

    const { error } = await updateProfile({
      full_name: formValues.fullName,
      phone: formValues.phone || null,
    });

    if (error) {
      setFormError('Could not save your changes. Try again.');
      return;
    }

    router.back();
  }

  const submit = handleSubmit(onSubmit, (invalid) => {
    if (invalid.phone) phoneRef.current?.focus();
  });

  return (
    <KeyboardScreen>
      <ScreenHeader title="Edit profile" className="mb-8" />

      <View className="gap-5">
        <Controller
          control={control}
          name="fullName"
          render={({ field }) => (
            <InputField
              label="Name"
              placeholder="Alex Mercer"
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              error={errors.fullName?.message}
              autoComplete="name"
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
              label="Phone"
              placeholder="+1 604 555 0148"
              value={field.value ?? ''}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              error={errors.phone?.message}
              keyboardType="phone-pad"
              autoComplete="tel"
              returnKeyType="go"
              submitBehavior="blurAndSubmit"
              onSubmitEditing={submit}
            />
          )}
        />

        <FormError message={formError} />

        <Button label="Save changes" loading={isSubmitting} onPress={submit} />
      </View>
    </KeyboardScreen>
  );
}
