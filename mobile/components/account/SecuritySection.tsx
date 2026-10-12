import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { ListRow } from '@/components/account/ListRow';
import { Badge } from '@/components/ui/Badge';
import type { Profile } from '@/lib/profile';

export interface SecuritySectionProps {
  profile: Profile;
  onResetPassword: () => void;
  onToggleTwoFactor: () => void;
}

export function SecuritySection({
  profile,
  onResetPassword,
  onToggleTwoFactor,
}: SecuritySectionProps) {
  const { t } = useTranslation();

  return (
    <View className="rounded-12 border-1 border-border bg-surface px-4">
      <ListRow
        icon="lock"
        title={t('account.resetPassword')}
        subtitle={t('security.resetSubtitle')}
        showChevron
        onPress={onResetPassword}
        hint={t('security.resetHint')}
        className="border-b-1 border-border"
      />
      <ListRow
        icon="shield"
        title={t('security.twoFactor')}
        subtitle={profile.two_factor_enabled ? t('security.twoFactorOn') : t('security.twoFactorOff')}
        trailing={
          <Badge
            label={profile.two_factor_enabled ? t('common.on') : t('common.off')}
            variant={profile.two_factor_enabled ? 'success' : 'neutral'}
          />
        }
        onPress={onToggleTwoFactor}
        hint={t('security.twoFactorHint')}
      />
    </View>
  );
}
