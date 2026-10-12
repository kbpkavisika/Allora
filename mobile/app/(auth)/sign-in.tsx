import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'expo-router';
import { useRef, useState } from 'react';
import { Controller, useForm, type FieldErrors } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Text, TextInput, View } from 'react-native';

import { SocialAuthButtons } from '@/components/auth/SocialAuthButtons';
import { Button } from '@/components/ui/Button';
import { Divider } from '@/components/ui/Divider';
import { FormError } from '@/components/ui/FormError';
import { InputField } from '@/components/ui/InputField';
import { KeyboardScreen } from '@/components/ui/KeyboardScreen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { getAuthErrorMessage } from '@/lib/authErrors';
import { signInSchema, type SignInValues } from '@/lib/schemas';
import { supabase } from '@/lib/supabase';

export default function SignInScreen() {
  const { t } = useTranslation();
  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const [formError, setFormError] = useState<string | null>(null);

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

  async function onSubmit(values: SignInValues) {
    setFormError(null);

    const { error } = await supabase.auth.signInWithPassword({
      email: values.email,
      password: values.password,
    });

    if (error) {
      setFormError(getAuthErrorMessage(error));
    }
  }

  function focusFirstInvalid(invalid: FieldErrors<SignInValues>) {
    if (invalid.email) emailRef.current?.focus();
    else if (invalid.password) passwordRef.current?.focus();
  }

  const submit = handleSubmit(onSubmit, focusFirstInvalid);

  return (
    <KeyboardScreen>
      <ScreenHeader title={t('auth.signIn.title')} className="mb-6" />

      <View className="gap-5">
        <Controller
          control={control}
          name="email"
          render={({ field }) => (
            <InputField
              ref={emailRef}
              label={t('auth.email')}
              placeholder={t('auth.emailPlaceholder')}
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
            <InputField
              ref={passwordRef}
              label={t('auth.password')}
              placeholder={t('auth.signIn.passwordPlaceholder')}
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              error={errors.password?.message}
              isSecure
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
          label={t('auth.signIn.forgotPassword')}
          hint={t('auth.signIn.forgotPasswordHint')}
          fullWidth={false}
          // TODO(auth)
          onPress={() => console.log('forgot password')}
        />

        <FormError message={formError} />

        <Button label={t('auth.logIn')} loading={isSubmitting} onPress={submit} />
      </View>

      <Divider label={t('auth.or')} className="my-6" />

      <SocialAuthButtons />

      <View className="mt-8 flex-row items-center justify-center gap-2">
        <Text className="type-text-primary text-secondary">{t('auth.signIn.newTo')}</Text>
        <Link href="/sign-up" role="link" className="type-label-lg text-primary underline">
          {t('auth.signIn.createAccount')}
        </Link>
      </View>
    </KeyboardScreen>
  );
}
