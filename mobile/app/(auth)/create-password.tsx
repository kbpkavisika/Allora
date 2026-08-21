import { zodResolver } from '@hookform/resolvers/zod';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Text, TextInput, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { FormError } from '@/components/ui/form-error';
import { KeyboardScreen } from '@/components/ui/keyboard-screen';
import { ScreenHeader } from '@/components/ui/screen-header';
import { TextField } from '@/components/ui/text-field';
import { getAuthErrorMessage } from '@/lib/auth-errors';
import { createPasswordSchema, type CreatePasswordValues } from '@/lib/schemas';
import { supabase } from '@/lib/supabase';

export default function CreatePasswordScreen() {
  const { email } = useLocalSearchParams<{ email?: string }>();
  const passwordRef = useRef<TextInput>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreatePasswordValues>({
    resolver: zodResolver(createPasswordSchema),
    defaultValues: { password: '' },
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

  const submit = handleSubmit(onSubmit, () => passwordRef.current?.focus());

  if (!email) {
    return null;
  }

  return (
    <KeyboardScreen>
      <ScreenHeader title="Create a password" className="mb-2" />

      <Text className="type-text-primary mb-8 text-secondary">
        You are creating an account for {email}.
      </Text>

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
