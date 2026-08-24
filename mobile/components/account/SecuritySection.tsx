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
  return (
    <View className="rounded-12 border-1 border-border bg-surface px-4">
      <ListRow
        icon="lock"
        title="Reset password"
        subtitle="Update the password for your account"
        showChevron
        onPress={onResetPassword}
        hint="Opens the reset password screen"
        className="border-b-1 border-border"
      />
      <ListRow
        icon="shield"
        title="Two-step verification"
        subtitle={profile.two_factor_enabled ? 'Extra verification is on' : 'Extra verification is off'}
        trailing={
          <Badge
            label={profile.two_factor_enabled ? 'On' : 'Off'}
            variant={profile.two_factor_enabled ? 'success' : 'neutral'}
          />
        }
        onPress={onToggleTwoFactor}
        hint="Toggles two-step verification"
      />
    </View>
  );
}
