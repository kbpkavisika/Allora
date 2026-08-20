import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'expo-router';
import { useRef } from 'react';
import { Controller, useForm, type FieldErrors } from 'react-hook-form';
import { Text, TextInput, View } from 'react-native';

import { SocialAuthButtons } from '@/components/auth/social-auth-buttons';
import { Button } from '@/components/ui/button';
import { Divider } from '@/components/ui/divider';
import { KeyboardScreen } from '@/components/ui/keyboard-screen';
import { ScreenHeader } from '@/components/ui/screen-header';
import { TextField } from '@/components/ui/text-field';
import { signInSchema, type SignInValues } from '@/lib/schemas';

export default function SignInScreen() {
  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: '', password: '' },
    mode: 'onSubmit',
    reValidateMode: 'onChange',
  });

  function onSubmit(values: SignInValues) {
    // TODO(auth)
    console.log('sign-in submitted', values);
  }

  function focusFirstInvalid(invalid: FieldErrors<SignInValues>) {
    if (invalid.email) emailRef.current?.focus();
    else if (invalid.password) passwordRef.current?.focus();
  }

  const submit = handleSubmit(onSubmit, focusFirstInvalid);

  return (
    <KeyboardScreen>
      <ScreenHeader title="Log in to Allora" className="mb-8" />

      <View className="gap-5">
        <Controller
          control={control}
          name="email"
          render={({ field }) => (
            <TextField
              ref={emailRef}
              label="Email"
              placeholder="hello@company.com"
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              error={errors.email?.message}
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
            <TextField
              ref={passwordRef}
              label="Password"
              placeholder="Your password"
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              error={errors.password?.message}
              secure
              textContentType="password"
              autoComplete="current-password"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="go"
              submitBehavior="blurAndSubmit"
              onSubmitEditing={submit}
            />
          )}
        />

        <Button
          variant="link"
          label="Forgot password?"
          hint="Opens password recovery"
          fullWidth={false}
          // TODO(auth)
          onPress={() => console.log('forgot password')}
        />

        <Button label="Log in" loading={isSubmitting} onPress={submit} />
      </View>

      <Divider label="OR" className="my-6" />

      <SocialAuthButtons />

      <View className="mt-8 flex-row items-center justify-center gap-2">
        <Text className="type-text-primary text-secondary">New to Allora?</Text>
        <Link href="/sign-up" role="link" className="type-label-lg text-primary underline">
          Create an account
        </Link>
      </View>
    </KeyboardScreen>
  );
}
