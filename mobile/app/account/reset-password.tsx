import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Text, TextInput, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { FormError } from '@/components/ui/FormError';
import { InputField } from '@/components/ui/InputField';
import { KeyboardScreen } from '@/components/ui/KeyboardScreen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { SuccessBanner } from '@/components/ui/SuccessBanner';
import { useAuth } from '@/lib/AuthProvider';
import { getAuthErrorMessage } from '@/lib/authErrors';
import { resetPasswordSchema, type ResetPasswordValues } from '@/lib/schemas';
import { supabase } from '@/lib/supabase';

const STRENGTH_LABEL = ['Weak', 'Weak', 'Medium', 'Strong'] as const;
const STRENGTH_TONE = ['bg-error', 'bg-error', 'bg-warning', 'bg-success'] as const;

function passwordStrength(password: string): 0 | 1 | 2 | 3 {
  if (password.length === 0) return 0;
  let score = 0;
  if (password.length >= 6) score++;
  if (password.length >= 10) score++;
  if (/[0-9]/.test(password) && /[a-zA-Z]/.test(password)) score++;
  return Math.min(score, 3) as 0 | 1 | 2 | 3;
}

export default function ResetPasswordScreen() {
  const { session } = useAuth();
  const email = session?.user.email ?? '';
  const newPasswordRef = useRef<TextInput>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [linkSent, setLinkSent] = useState(false);

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { currentPassword: '', newPassword: '' },
    mode: 'onSubmit',
    reValidateMode: 'onChange',
  });

  const strength = passwordStrength(watch('newPassword'));

  async function onSubmit(values: ResetPasswordValues) {
    setFormError(null);

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password: values.currentPassword,
    });

    if (signInError) {
      setFormError('Current password is incorrect.');
      return;
    }

    const { error } = await supabase.auth.updateUser({ password: values.newPassword });

    if (error) {
      setFormError(getAuthErrorMessage(error));
      return;
    }

    router.back();
  }

  async function sendResetLink() {
    setFormError(null);
    const { error } = await supabase.auth.resetPasswordForEmail(email);

    if (error) {
      setFormError(getAuthErrorMessage(error));
      return;
    }

    setLinkSent(true);
  }

  const submit = handleSubmit(onSubmit, (invalid) => {
    if (!invalid.currentPassword && invalid.newPassword) newPasswordRef.current?.focus();
  });

  return (
    <KeyboardScreen>
      <ScreenHeader title="Reset password" className="mb-2" />
      <Text className="type-text-primary mb-8 text-secondary">
        Choose a new password for {email}. You&rsquo;ll stay signed in on this device.
      </Text>

      <View className="gap-5">
        <Controller
          control={control}
          name="currentPassword"
          render={({ field }) => (
            <InputField
              label="Current password"
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              error={errors.currentPassword?.message}
              isSecure
              textContentType="password"
              autoComplete="current-password"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="next"
              submitBehavior="submit"
              onSubmitEditing={() => newPasswordRef.current?.focus()}
            />
          )}
        />

        <View className="gap-2">
          <Controller
            control={control}
            name="newPassword"
            render={({ field }) => (
              <InputField
                ref={newPasswordRef}
                label="New password"
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                error={errors.newPassword?.message}
                isSecure
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

          {watch('newPassword').length > 0 ? (
            <View className="flex-row items-center gap-2">
              <View className="h-1 flex-1 flex-row gap-1">
                {[0, 1, 2].map((segment) => (
                  <View
                    key={segment}
                    className={`h-1 flex-1 rounded-full ${
                      segment < strength ? STRENGTH_TONE[strength] : 'bg-border'
                    }`}
                  />
                ))}
              </View>
              <Text className="type-text-secondary text-secondary">{STRENGTH_LABEL[strength]}</Text>
            </View>
          ) : null}
        </View>

        <FormError message={formError} />
        <SuccessBanner message={linkSent ? 'Check your inbox for a reset link.' : null} />

        <Button label="Save new password" loading={isSubmitting} onPress={submit} />

        <Button
          variant="link"
          label="Send me a reset link instead"
          className="self-center"
          onPress={sendResetLink}
        />
      </View>
    </KeyboardScreen>
  );
}
