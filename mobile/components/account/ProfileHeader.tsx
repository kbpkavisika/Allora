import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';

export interface ProfileHeaderProps {
  name: string | null;
  email: string;
  onEdit?: () => void;
}

export function ProfileHeader({ name, email, onEdit }: Readonly<ProfileHeaderProps>) {
  const { t } = useTranslation();
  const firstName = name?.trim().split(/\s+/)[0];

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
          {firstName ? t('profileHeader.greeting', { name: firstName }) : t('profileHeader.greetingAnonymous')}
        </Text>
        <Text className="type-text-secondary text-secondary" numberOfLines={1}>
          {email}
        </Text>
      </View>

      {onEdit ? (
        <Button
          variant="secondary"
          size="sm"
          label={t('common.edit')}
          fullWidth={false}
          onPress={onEdit}
          hint={t('profileHeader.editHint')}
          className="self-center"
        />
      ) : null}
    </View>
  );
}
