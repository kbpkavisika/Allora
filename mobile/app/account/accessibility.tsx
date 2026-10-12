import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
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
    if (error) setFormError(t('accessibility.saveError'));
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
        title={t('accessibility.title')}
        subtitle={t('accessibility.subtitle')}
        className="mb-5"
      />

      <View className="gap-5">
        <Card>
          {ACCESSIBILITY_FEATURES.map((key, index) => (
            <Controller
              key={key}
              control={control}
              name={key}
              render={({ field: { value, onChange } }) => (
                <ToggleRow
                  title={t(`accessibility.features.${key}.title`)}
                  description={t(`accessibility.features.${key}.description`)}
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
          <Text className="type-label-lg text-primary">{t('accessibility.deviceSettingsTitle')}</Text>
          <Text className="type-text-primary text-secondary">
            {t('accessibility.deviceSettingsBody')}
          </Text>
        </View>
      </View>
    </KeyboardScreen>
  );
}
