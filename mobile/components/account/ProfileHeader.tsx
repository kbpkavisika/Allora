import { Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';

export interface ProfileHeaderProps {
  name: string | null;
  email: string;
  onEdit?: () => void;
}

function greeting(name: string | null) {
  const firstName = name?.trim().split(/\s+/)[0];
  return firstName ? `Hi ${firstName}` : 'Hi there';
}

export function ProfileHeader({ name, email, onEdit }: Readonly<ProfileHeaderProps>) {
  return (
    <View className="flex-row items-center gap-4">
      <View className="h-[56px] w-[56px] items-center justify-center rounded-full bg-surface-sunken">
        <Icon name="account" size="lg" className="text-secondary" />
      </View>

      <View className="flex-1 gap-0.5">
        <Text
          role="heading"
          className="type-h1 text-primary"
          numberOfLines={1}
          maxFontSizeMultiplier={1.5}>
          {greeting(name)}
        </Text>
        <Text className="type-text-secondary text-secondary" numberOfLines={1}>
          {email}
        </Text>
      </View>

      {onEdit ? (
        <Button
          variant="secondary"
          size="sm"
          label="Edit"
          fullWidth={false}
          onPress={onEdit}
          hint="Edits your name and phone number"
          className="self-center"
        />
      ) : null}
    </View>
  );
}
