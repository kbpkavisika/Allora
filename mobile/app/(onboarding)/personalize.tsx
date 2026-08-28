import { router } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { PreferenceRow } from '@/components/onboarding/PreferenceRow';
import { Button } from '@/components/ui/Button';
import { FormError } from '@/components/ui/FormError';
import { KeyboardScreen } from '@/components/ui/KeyboardScreen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { useProfile } from '@/hooks/useProfile';

const PREFERENCES = [
  {
    key: 'large_text',
    title: 'Large text',
    description: 'Scales every label and price up one step.',
  },
  {
    key: 'high_contrast',
    title: 'High contrast',
    description: 'Stronger borders and darker body text.',
  },
  {
    key: 'dictation_enabled',
    title: 'Dictation',
    description: 'Speak into any field instead of typing.',
  },
  {
    key: 'screen_reader_support',
    title: 'Screen reader support',
    description: 'Extra spoken labels and reading order cues.',
  },
  {
    key: 'reduce_motion',
    title: 'Reduce motion',
    description: 'Removes sliding and fading transitions.',
  },
] as const;

type PreferenceKey = (typeof PREFERENCES)[number]['key'];

const ROLE_SELECT_ROUTE = '/(onboarding)/role-select' as const;

export default function PersonalizeScreen() {
  const { updateProfile } = useProfile();
  const [preferences, setPreferences] = useState<Record<PreferenceKey, boolean>>({
    large_text: false,
    high_contrast: false,
    dictation_enabled: false,
    screen_reader_support: false,
    reduce_motion: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  function toggle(key: PreferenceKey) {
    setPreferences((current) => ({ ...current, [key]: !current[key] }));
  }

  async function saveAndContinue() {
    setFormError(null);
    setIsSubmitting(true);

    const { error } = await updateProfile(preferences);

    setIsSubmitting(false);

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
        {PREFERENCES.map((preference) => (
          <PreferenceRow
            key={preference.key}
            title={preference.title}
            description={preference.description}
            checked={preferences[preference.key]}
            onChange={() => toggle(preference.key)}
          />
        ))}
      </View>

      <FormError message={formError} className="mt-4" />

      <Text className="type-text-secondary mt-5 text-center text-secondary">
        You can change these later in the settings.
      </Text>

      <Button label="Continue" loading={isSubmitting} onPress={saveAndContinue} className="mt-4" />

      <Button
        variant="link"
        label="Skip for now"
        className="mt-4 self-center"
        onPress={() => router.replace(ROLE_SELECT_ROUTE)}
      />
    </KeyboardScreen>
  );
}
