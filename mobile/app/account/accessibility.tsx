import { useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';

import { Card } from '@/components/ui/Card';
import { FormError } from '@/components/ui/FormError';
import { KeyboardScreen } from '@/components/ui/KeyboardScreen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { ToggleRow } from '@/components/ui/ToggleRow';
import { useProfile } from '@/hooks/useProfile';
import { ACCESSIBILITY_FEATURES } from '@/lib/profile';

export default function EditAccessibilityScreen() {
  const { profile, updateProfile } = useProfile();
  const [formError, setFormError] = useState<string | null>(null);

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
            <ToggleRow
              key={feature.key}
              title={feature.title}
              description={feature.description}
              value={profile[feature.key]}
              onValueChange={async (next) => {
                setFormError(null);
                const { error } = await updateProfile({ [feature.key]: next });
                if (error) setFormError('Could not save that setting. Try again.');
              }}
              className={`p-4 ${
                index < ACCESSIBILITY_FEATURES.length - 1 ? 'border-b-1 border-border' : ''
              }`}
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
