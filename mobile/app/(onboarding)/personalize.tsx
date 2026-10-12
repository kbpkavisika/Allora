import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

import { PreferenceRow } from '@/components/onboarding/PreferenceRow';
import { Button } from '@/components/ui/Button';
import { FormError } from '@/components/ui/FormError';
import { KeyboardScreen } from '@/components/ui/KeyboardScreen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { useProfile } from '@/hooks/useProfile';
import { ACCESSIBILITY_FEATURES } from '@/lib/profile';
import {
  accessibilityPreferencesSchema,
  type AccessibilityPreferencesValues,
} from '@/lib/schemas';

const ROLE_SELECT_ROUTE = '/(onboarding)/role-select' as const;

export default function PersonalizeScreen() {
  const { t } = useTranslation();
  const { updateProfile } = useProfile();
  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<AccessibilityPreferencesValues>({
    resolver: zodResolver(accessibilityPreferencesSchema),
    defaultValues: {
      large_text: false,
      high_contrast: false,
      dictation_enabled: false,
      screen_reader_support: true,
      reduce_motion: false,
    },
  });
  const [formError, setFormError] = useState<string | null>(null);

  async function onSubmit(preferences: AccessibilityPreferencesValues) {
    setFormError(null);

    const { error } = await updateProfile(preferences);

    if (error) {
      setFormError(t('onboarding.personalize.saveError'));
      return;
    }

    router.replace(ROLE_SELECT_ROUTE);
  }

  return (
    <KeyboardScreen>
      <ScreenHeader
        title={t('onboarding.personalize.title')}
        subtitle={t('onboarding.personalize.subtitle')}
        showBack={false}
        className="mb-6"
      />

      <View className="gap-0.5">
        {ACCESSIBILITY_FEATURES.map((key) => (
          <Controller
            key={key}
            control={control}
            name={key}
            render={({ field: { value, onChange } }) => (
              <PreferenceRow
                title={t(`accessibility.features.${key}.title`)}
                description={t(`accessibility.features.${key}.description`)}
                checked={key === 'screen_reader_support' || value}
                disabled={key === 'screen_reader_support'}
                onChange={onChange}
              />
            )}
          />
        ))}
      </View>

      <FormError message={formError} className="mt-4" />

      <Text className="type-text-secondary mt-5 text-center text-secondary">
        {t('onboarding.personalize.changeLater')}
      </Text>

      <Button label={t('common.continue')} loading={isSubmitting} onPress={handleSubmit(onSubmit)} className="mt-4" />

      <Button
        variant="link"
        label={t('onboarding.personalize.skip')}
        className="mt-4 self-center"
        onPress={() => router.replace(ROLE_SELECT_ROUTE)}
      />
    </KeyboardScreen>
  );
}
