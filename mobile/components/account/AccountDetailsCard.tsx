import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { ListRow } from '@/components/account/ListRow';
import { Badge } from '@/components/ui/Badge';
import { Toggle } from '@/components/ui/Toggle';
import { memberSince, type Profile } from '@/lib/profile';

export interface AccountDetailsCardProps {
  profile: Profile;
  email: string;
  onEditName: () => void;
  onEditPhone: () => void;
  onToggleSms: (value: boolean) => void;
}

export function AccountDetailsCard({
  profile,
  email,
  onEditName,
  onEditPhone,
  onToggleSms,
}: AccountDetailsCardProps) {
  const { t } = useTranslation();

  return (
    <View className="rounded-12 border-1 border-border bg-surface px-4">
      <ListRow
        label={t('account.name')}
        value={profile.full_name ?? t('accountDetails.addName')}
        showChevron
        onPress={onEditName}
        hint={t('accountDetails.editNameHint')}
        className="border-b-1 border-border"
      />
      <ListRow
        label={t('auth.email')}
        value={email}
        trailing={<Badge label={t('accountDetails.verified')} variant="success" />}
        className="border-b-1 border-border"
      />
      <ListRow
        label={t('account.phone')}
        value={profile.phone ?? t('accountDetails.addPhone')}
        showChevron
        onPress={onEditPhone}
        hint={t('accountDetails.editPhoneHint')}
        className="border-b-1 border-border"
      />
      <ListRow
        label={t('account.seller.memberSince')}
        value={memberSince(profile.created_at)}
        className="border-b-1 border-border"
      />
      <ListRow
        title={t('accountDetails.sms')}
        subtitle={t('accountDetails.smsSubtitle')}
        trailing={
          <Toggle
            label={t('accountDetails.sms')}
            value={profile.sms_order_updates}
            onValueChange={onToggleSms}
          />
        }
      />
    </View>
  );
}
