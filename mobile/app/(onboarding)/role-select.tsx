import { useState } from 'react';
import { Text, View } from 'react-native';

import { RoleOptionCard } from '@/components/onboarding/RoleOptionCard';
import { Button } from '@/components/ui/Button';
import { FormError } from '@/components/ui/FormError';
import { KeyboardScreen } from '@/components/ui/KeyboardScreen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { useProfile } from '@/hooks/useProfile';
import type { UserRole } from '@/lib/profile';

export default function RoleSelectScreen() {
  const { updateProfile } = useProfile();
  const [role, setRole] = useState<UserRole | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function submit() {
    if (!role) {
      setFormError('Choose an option to continue.');
      return;
    }

    setFormError(null);
    setIsSubmitting(true);

    const { error } = await updateProfile({ role });

    setIsSubmitting(false);

    if (error) {
      setFormError('Something went wrong saving your choice. Please try again.');
    }
  }

  return (
    <KeyboardScreen>
      <ScreenHeader title="How will you use Allora?" showBack={false} className="mb-6" />

      <View className="gap-3" role="radiogroup" aria-label="How will you use Allora?">
        <RoleOptionCard
          icon="cart"
          title="I want to buy"
          description="Browse and order from local sellers"
          selected={role === 'user'}
          onPress={() => setRole('user')}
        />
        <RoleOptionCard
          icon="shop"
          title="I want to sell"
          description="List products by voice, manage a small shop"
          selected={role === 'seller'}
          onPress={() => setRole('seller')}
        />
      </View>

      <FormError message={formError} className="mt-4" />

      <Text className="type-text-secondary mt-6 text-center text-secondary">
        You can switch roles any time from your profile.
      </Text>

      <Button label="Continue" loading={isSubmitting} onPress={submit} className="mt-4" />
    </KeyboardScreen>
  );
}
