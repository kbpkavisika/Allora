import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Card } from '@/components/ui/Card';
import { FormError } from '@/components/ui/FormError';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { ToggleRow } from '@/components/ui/ToggleRow';
import { useProfile } from '@/hooks/useProfile';
import {
  notificationPreferencesSchema,
  type NotificationPreferencesValues,
} from '@/lib/schemas';

export function NotificationSettingsCard() {
  const { t } = useTranslation();
  const { profile, updateProfile } = useProfile();
  const [formError, setFormError] = useState<string | null>(null);

  const values = useMemo<NotificationPreferencesValues | undefined>(
    () => (profile ? { message_notifications: profile.message_notifications } : undefined),
    [profile]
  );

  const { control, handleSubmit } = useForm<NotificationPreferencesValues>({
    resolver: zodResolver(notificationPreferencesSchema),
    values,
  });

  async function onSubmit(formValues: NotificationPreferencesValues) {
    setFormError(null);
    const { error } = await updateProfile(formValues);
    if (error) setFormError(t('accessibility.saveError'));
  }

  const save = handleSubmit(onSubmit);

  return (
    <View className="gap-3">
      <SectionHeader title={t('notifications.title')} />
      <Card>
        <Controller
          control={control}
          name="message_notifications"
          render={({ field: { value, onChange } }) => (
            <ToggleRow
              title={t('notifications.messages')}
              description={t('notifications.messagesDescription')}
              value={value}
              onValueChange={(next) => {
                onChange(next);
                save();
              }}
              className="p-4"
            />
          )}
        />
      </Card>
      <FormError message={formError} />
    </View>
  );
}
