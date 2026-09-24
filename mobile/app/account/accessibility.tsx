import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { ActivityIndicator, Text, View } from 'react-native';

import { Card } from '@/components/ui/Card';
import { FormError } from '@/components/ui/FormError';
import { KeyboardScreen } from '@/components/ui/KeyboardScreen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { ToggleRow } from '@/components/ui/ToggleRow';
import { useProfile } from '@/hooks/useProfile';
import { ACCESSIBILITY_FEATURES } from '@/lib/profile';
import {
  accessibilityPreferencesSchema,
  type AccessibilityPreferencesValues,
} from '@/lib/schemas';

export default function EditAccessibilityScreen() {
  const { profile, updateProfile } = useProfile();
  const [formError, setFormError] = useState<string | null>(null);

  const values = useMemo<AccessibilityPreferencesValues | undefined>(
    () =>
      profile
        ? {
            large_text: profile.large_text,
            high_contrast: profile.high_contrast,
            dictation_enabled: profile.dictation_enabled,
            screen_reader_support: profile.screen_reader_support,
            reduce_motion: profile.reduce_motion,
          }
        : undefined,
    [profile]
  );

  const { control, handleSubmit } = useForm<AccessibilityPreferencesValues>({
    resolver: zodResolver(accessibilityPreferencesSchema),
    values,
  });

  async function onSubmit(formValues: AccessibilityPreferencesValues) {
    setFormError(null);
    const { error } = await updateProfile(formValues);
    if (error) setFormError('Could not save that setting. Try again.');
  }

  const save = handleSubmit(onSubmit);

  if (!profile) {
    return (
      <View className="flex-1 items-center justify-center bg-surface">
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <KeyboardScreen>
      <ScreenHeader
        title="Accessibility"
        subtitle="Turn on what helps. Changes apply everywhere in Allora straight away."
        className="mb-5"
      />

      <View className="gap-5">
        <Card>
          {ACCESSIBILITY_FEATURES.map((feature, index) => (
            <Controller
              key={feature.key}
              control={control}
              name={feature.key}
              render={({ field: { value, onChange } }) => (
                <ToggleRow
                  title={feature.title}
                  description={feature.description}
                  value={value}
                  onValueChange={(next) => {
                    onChange(next);
                    save();
                  }}
                  className={`p-4 ${
                    index < ACCESSIBILITY_FEATURES.length - 1 ? 'border-b-1 border-border' : ''
                  }`}
                />
              )}
            />
          ))}
        </Card>

        <FormError message={formError} />

        <View className="gap-1 rounded-12 border-1 border-info-tint-border bg-info-tint p-4">
          <Text className="type-label-lg text-primary">Using your device settings</Text>
          <Text className="type-text-primary text-secondary">
            Allora also follows the text size and motion settings from iOS, so you may already be
            covered.
          </Text>
        </View>
      </View>
    </KeyboardScreen>
  );
}
