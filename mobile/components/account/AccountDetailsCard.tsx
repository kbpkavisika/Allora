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
  return (
    <View className="rounded-12 border-1 border-border bg-surface px-4">
      <ListRow
        label="Name"
        value={profile.full_name ?? 'Add your name'}
        showChevron
        onPress={onEditName}
        hint="Edits your name"
        className="border-b-1 border-border"
      />
      <ListRow
        label="Email"
        value={email}
        trailing={<Badge label="Verified" variant="success" />}
        className="border-b-1 border-border"
      />
      <ListRow
        label="Phone"
        value={profile.phone ?? 'Add a phone number'}
        showChevron
        onPress={onEditPhone}
        hint="Edits your phone number"
        className="border-b-1 border-border"
      />
      <ListRow
        label="Member since"
        value={memberSince(profile.created_at)}
        className="border-b-1 border-border"
      />
      <ListRow
        title="Order updates by SMS"
        subtitle="Shipping and delivery only"
        trailing={
          <Toggle
            label="Order updates by SMS"
            value={profile.sms_order_updates}
            onValueChange={onToggleSms}
          />
        }
      />
    </View>
  );
}
