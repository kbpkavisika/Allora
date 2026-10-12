import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

import { RoleOptionCard } from '@/components/onboarding/RoleOptionCard';
import { Button } from '@/components/ui/Button';
import { FormError } from '@/components/ui/FormError';
import { KeyboardScreen } from '@/components/ui/KeyboardScreen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { useProfile } from '@/hooks/useProfile';
import type { UserRole } from '@/lib/profile';

export default function RoleSelectScreen() {
  const { t } = useTranslation();
  const { updateProfile } = useProfile();
  const [role, setRole] = useState<UserRole | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function submit() {
    if (!role) {
      setFormError(t('onboarding.role.chooseOption'));
      return;
    }

    setFormError(null);
    setIsSubmitting(true);

    const { error } = await updateProfile({ role });

    setIsSubmitting(false);

    if (error) {
      setFormError(t('onboarding.role.saveError'));
    }
  }

  return (
    <KeyboardScreen>
      <ScreenHeader title={t('onboarding.role.title')} showBack={false} className="mb-6" />

      <View className="gap-3" role="radiogroup" aria-label={t('onboarding.role.title')}>
        <RoleOptionCard
          icon="cart"
          title={t('onboarding.role.buyTitle')}
          description={t('onboarding.role.buyDescription')}
          selected={role === 'user'}
          onPress={() => setRole('user')}
        />
        <RoleOptionCard
          icon="shop"
          title={t('onboarding.role.sellTitle')}
          description={t('onboarding.role.sellDescription')}
          selected={role === 'seller'}
          onPress={() => setRole('seller')}
        />
      </View>

      <FormError message={formError} className="mt-4" />

      <Text className="type-text-secondary mt-6 text-center text-secondary">
        {t('onboarding.role.switchLater')}
      </Text>

      <Button label={t('common.continue')} loading={isSubmitting} onPress={submit} className="mt-4" />
    </KeyboardScreen>
  );
}
