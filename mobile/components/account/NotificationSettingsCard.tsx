import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
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
    if (error) setFormError('Could not save that setting. Try again.');
  }

  const save = handleSubmit(onSubmit);

  return (
    <View className="gap-3">
      <SectionHeader title="Notifications" />
      <Card>
        <Controller
          control={control}
          name="message_notifications"
          render={({ field: { value, onChange } }) => (
            <ToggleRow
              title="Message notifications"
              description="Get notified about new messages. Mute a single chat from its screen."
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
