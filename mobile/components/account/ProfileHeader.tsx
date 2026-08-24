import { Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { initials } from '@/lib/profile';

export interface ProfileHeaderProps {
  name: string | null;
  email: string;
  onEdit: () => void;
}

export function ProfileHeader({ name, email, onEdit }: ProfileHeaderProps) {
  return (
    <View className="flex-row items-center gap-3">
      <View className="h-16 w-16 items-center justify-center rounded-full bg-surface-sunken">
        <Text className="type-h2 text-secondary" maxFontSizeMultiplier={1.2}>
          {initials(name, email)}
        </Text>
      </View>

      <View className="flex-1 gap-1">
        <Text
          role="heading"
          className="type-h2 text-primary"
          numberOfLines={1}
          maxFontSizeMultiplier={1.5}>
          {name ?? 'Your account'}
        </Text>
        <Text className="type-text-secondary text-secondary" numberOfLines={1}>
          {email}
        </Text>
      </View>

      <Button
        variant="secondary"
        size="sm"
        label="Edit"
        fullWidth={false}
        onPress={onEdit}
        hint="Edits your name and phone number"
        className="self-center"
      />
    </View>
  );
}
