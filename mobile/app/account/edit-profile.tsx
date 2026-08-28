import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { TextInput, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Divider } from '@/components/ui/Divider';
import { FormError } from '@/components/ui/FormError';
import { InputField } from '@/components/ui/InputField';
import { KeyboardScreen } from '@/components/ui/KeyboardScreen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { useProfile } from '@/hooks/useProfile';
import { useAuth } from '@/lib/AuthProvider';
import { profileSchema, type ProfileValues } from '@/lib/schemas';

const noop = () => {};

export default function EditPersonalInfoScreen() {
  const { session } = useAuth();
  const { profile, updateProfile } = useProfile();
  const phoneRef = useRef<TextInput>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const email = session?.user.email ?? '';

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
      <ScreenHeader title="Personal info" className="mb-5" />

      <View className="gap-5">
        <Controller
          control={control}
          name="fullName"
          render={({ field }) => (
            <InputField
              label="Full name"
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

        <InputField
          label="Email"
          isRequired
          isDisabled
          value={email}
          onChangeText={noop}
          helperText="Used for order updates and password resets."
        />

        <Controller
          control={control}
          name="phone"
          render={({ field }) => (
            <InputField
              ref={phoneRef}
              label="Phone"
              placeholder="+1 604 555 0142"
              value={field.value ?? ''}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              error={errors.phone?.message}
              valueVariant="mono"
              keyboardType="phone-pad"
              autoComplete="tel"
              returnKeyType="go"
              submitBehavior="blurAndSubmit"
              onSubmitEditing={submit}
            />
          )}
        />

        <Divider />

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
