import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
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
      screen_reader_support: false,
      reduce_motion: false,
    },
  });
  const [formError, setFormError] = useState<string | null>(null);

  async function onSubmit(preferences: AccessibilityPreferencesValues) {
    setFormError(null);

    const { error } = await updateProfile(preferences);

    if (error) {
      setFormError('Something went wrong saving your preferences. Please try again.');
      return;
    }

    router.replace(ROLE_SELECT_ROUTE);
  }

  return (
    <KeyboardScreen>
      <ScreenHeader
        title="How should Allora work for you?"
        subtitle="Pick anything you want on from the start. Select as many as you like."
        showBack={false}
        className="mb-6"
      />

      <View className="gap-0.5">
        {ACCESSIBILITY_FEATURES.map((preference) => (
          <Controller
            key={preference.key}
            control={control}
            name={preference.key}
            render={({ field: { value, onChange } }) => (
              <PreferenceRow
                title={preference.title}
                description={preference.description}
                checked={value}
                onChange={onChange}
              />
            )}
          />
        ))}
      </View>

      <FormError message={formError} className="mt-4" />

      <Text className="type-text-secondary mt-5 text-center text-secondary">
        You can change these later in the settings.
      </Text>

      <Button label="Continue" loading={isSubmitting} onPress={handleSubmit(onSubmit)} className="mt-4" />

      <Button
        variant="link"
        label="Skip for now"
        className="mt-4 self-center"
        onPress={() => router.replace(ROLE_SELECT_ROUTE)}
      />
    </KeyboardScreen>
  );
}
