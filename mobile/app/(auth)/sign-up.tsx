import { zodResolver } from '@hookform/resolvers/zod';
import { Link, router } from 'expo-router';
import { useRef } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Text, TextInput, View } from 'react-native';

import { SocialAuthButtons } from '@/components/auth/SocialAuthButtons';
import { Button } from '@/components/ui/Button';
import { Divider } from '@/components/ui/Divider';
import { InputField } from '@/components/ui/InputField';
import { KeyboardScreen } from '@/components/ui/KeyboardScreen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { signUpSchema, type SignUpValues } from '@/lib/schemas';

export default function SignUpScreen() {
  const emailRef = useRef<TextInput>(null);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { email: '' },
    mode: 'onSubmit',
    reValidateMode: 'onChange',
  });

  function onSubmit(values: SignUpValues) {
    router.push({ pathname: '/create-password', params: { email: values.email } });
  }

  const submit = handleSubmit(onSubmit, () => emailRef.current?.focus());

  return (
    <KeyboardScreen>
      <ScreenHeader title="Get your free account" className="mb-8" />

      <SocialAuthButtons />

      <Divider label="OR" className="my-6" />

      <View className="gap-5">
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
              returnKeyType="go"
              submitBehavior="blurAndSubmit"
              onSubmitEditing={submit}
            />
          )}
        />

        <Button label="Continue with Email" loading={isSubmitting} onPress={submit} />
      </View>

      <View className="mt-8 flex-row items-center justify-center gap-2">
        <Text className="type-text-primary text-secondary">Already have an account?</Text>
        <Link href="/sign-in" role="link" className="type-label-lg text-primary underline">
          Log in
        </Link>
      </View>
    </KeyboardScreen>
  );
}
