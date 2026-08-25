import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'expo-router';
import { useRef, useState } from 'react';
import { Controller, useForm, type FieldErrors } from 'react-hook-form';
import { Text, TextInput, View } from 'react-native';

import { SocialAuthButtons } from '@/components/auth/SocialAuthButtons';
import { Button } from '@/components/ui/Button';
import { Divider } from '@/components/ui/Divider';
import { FormError } from '@/components/ui/FormError';
import { InputField } from '@/components/ui/InputField';
import { KeyboardScreen } from '@/components/ui/KeyboardScreen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { getAuthErrorMessage } from '@/lib/authErrors';
import { signUpSchema, type SignUpValues } from '@/lib/schemas';
import { supabase } from '@/lib/supabase';

export default function SignUpScreen() {
  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const confirmPasswordRef = useRef<TextInput>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { email: '', password: '', confirmPassword: '' },
    mode: 'onSubmit',
    reValidateMode: 'onChange',
  });

  async function onSubmit(values: SignUpValues) {
    setFormError(null);

    const { data, error } = await supabase.auth.signUp({
      email: values.email,
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

  function focusFirstInvalid(invalid: FieldErrors<SignUpValues>) {
    if (invalid.email) emailRef.current?.focus();
    else if (invalid.password) passwordRef.current?.focus();
    else if (invalid.confirmPassword) confirmPasswordRef.current?.focus();
  }

  const submit = handleSubmit(onSubmit, focusFirstInvalid);

  return (
    <KeyboardScreen>
      <ScreenHeader
        title="Get your free account"
        subtitle="Every field can be dictated instead of typed."
        className="mb-6"
      />

      <View className="gap-4">
        <Controller
          control={control}
          name="email"
          render={({ field }) => (
            <InputField
              ref={emailRef}
              label="Email"
              placeholder="hello@company.com"
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              error={errors.email?.message}
              isRequired
              keyboardType="email-address"
              textContentType="emailAddress"
              autoComplete="email"
              autoCapitalize="none"
              autoCorrect={false}
              spellCheck={false}
              returnKeyType="next"
              submitBehavior="submit"
              onSubmitEditing={() => passwordRef.current?.focus()}
            />
          )}
        />

        <Controller
          control={control}
          name="password"
          render={({ field }) => (
            <InputField
              ref={passwordRef}
              label="Password"
              placeholder="At least 8 characters"
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              error={errors.password?.message}
              isSecure
              isRequired
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
            <InputField
              ref={confirmPasswordRef}
              label="Confirm password"
              placeholder="Re-enter your password"
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              error={errors.confirmPassword?.message}
              isSecure
              isRequired
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
      </View>

      <Button
        label="Continue with email"
        loading={isSubmitting}
        onPress={submit}
        className="mt-6"
      />

      <Divider label="OR" className="my-6" />

      <SocialAuthButtons />

      <View className="mt-6 flex-row items-center justify-center gap-2">
        <Text className="type-text-primary text-secondary">Already have an account?</Text>
        <Link href="/sign-in" role="link" className="type-label-lg text-primary underline">
          Log in
        </Link>
      </View>
    </KeyboardScreen>
  );
}
