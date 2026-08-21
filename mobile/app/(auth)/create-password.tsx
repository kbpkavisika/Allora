import { zodResolver } from '@hookform/resolvers/zod';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { TextInput, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { FormError } from '@/components/ui/FormError';
import { KeyboardScreen } from '@/components/ui/KeyboardScreen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { TextField } from '@/components/ui/TextField';
import { getAuthErrorMessage } from '@/lib/authErrors';
import { createPasswordSchema, type CreatePasswordValues } from '@/lib/schemas';
import { supabase } from '@/lib/supabase';

export default function CreatePasswordScreen() {
  const { email } = useLocalSearchParams<{ email?: string }>();
  const passwordRef = useRef<TextInput>(null);
  const confirmPasswordRef = useRef<TextInput>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreatePasswordValues>({
    resolver: zodResolver(createPasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
    mode: 'onSubmit',
    reValidateMode: 'onChange',
  });

  useEffect(() => {
    if (!email) {
      router.replace('/sign-up');
    }
  }, [email]);

  async function onSubmit(values: CreatePasswordValues) {
    if (!email) return;

    setFormError(null);

    const { data, error } = await supabase.auth.signUp({
      email,
      password: values.password,
    });

    if (error) {
      setFormError(getAuthErrorMessage(error));
      return;
    }

    if (!data.session) {
      setFormError('Check your inbox to confirm your email address, then log in.');
    }
  }

  const submit = handleSubmit(onSubmit, (fieldErrors) => {
    const target = fieldErrors.password ? passwordRef : confirmPasswordRef;
    target.current?.focus();
  });

  if (!email) {
    return null;
  }

  return (
    <KeyboardScreen>
      <ScreenHeader title="Create a password" className="mb-8" />

      <View className="gap-5">
        <Controller
          control={control}
          name="password"
          render={({ field }) => (
            <TextField
              ref={passwordRef}
              label="Password"
              placeholder="At least 6 characters"
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              error={errors.password?.message}
              secure
              required
              textContentType="newPassword"
              autoComplete="new-password"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="next"
              submitBehavior="submit"
              onSubmitEditing={() => confirmPasswordRef.current?.focus()}
            />
          )}
        />

        <Controller
          control={control}
          name="confirmPassword"
          render={({ field }) => (
            <TextField
              ref={confirmPasswordRef}
              label="Confirm password"
              placeholder="Re-enter your password"
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              error={errors.confirmPassword?.message}
              secure
              required
              textContentType="newPassword"
              autoComplete="new-password"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="go"
              submitBehavior="blurAndSubmit"
              onSubmitEditing={submit}
            />
          )}
        />

        <FormError message={formError} />

        <Button label="Create account" loading={isSubmitting} onPress={submit} />
      </View>
    </KeyboardScreen>
  );
}
