import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ListRow } from '@/components/account/ListRow';
import { NotificationSettingsCard } from '@/components/account/NotificationSettingsCard';
import { ProfileHeader } from '@/components/account/ProfileHeader';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { CountBadge } from '@/components/ui/CountBadge';
import { FormError } from '@/components/ui/FormError';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { SuccessBanner } from '@/components/ui/SuccessBanner';
import { useChat } from '@/hooks/useChat';
import { useProfile } from '@/hooks/useProfile';
import { signOut, useAuth } from '@/lib/AuthProvider';
import { getAuthErrorMessage } from '@/lib/authErrors';
import { enabledAccessibilityFeatures, formatAddressLines } from '@/lib/profile';
import { supabase } from '@/lib/supabase';
import { languageName } from '@/lib/i18n';

export default function AccountScreen() {
  const { t, i18n } = useTranslation();
  const insets = useSafeAreaInsets();
  const { session } = useAuth();
  const { profile, addresses, refresh } = useProfile();
  const { unreadCount } = useChat();
  const [resetSent, setResetSent] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);
  const [isSendingReset, setIsSendingReset] = useState(false);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  if (!profile || !session) {
    return (
      <View className="flex-1 items-center justify-center bg-surface">
        <ActivityIndicator />
      </View>
    );
  }

  const email = session.user.email ?? '';
  const userId = session.user.id;
  const defaultAddress = addresses.find((address) => address.is_default) ?? addresses[0];

  async function sendResetLink() {
    setResetError(null);
    setResetSent(false);
    setIsSendingReset(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email);

    setIsSendingReset(false);

    if (error) {
      setResetError(getAuthErrorMessage(error));
      return;
    }

    setResetSent(true);
  }

  function confirmSignOut() {
    Alert.alert(t('account.signOut'), t('account.buyer.signOutBody'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('account.signOut'), style: 'destructive', onPress: () => signOut() },
    ]);
  }

  function confirmDeleteAccount() {
    Alert.alert(
      t('account.deleteAccount'),
      t('account.buyer.deleteBody'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('account.deleteAccount'),
          style: 'destructive',
          onPress: async () => {
            await supabase.from('profiles').delete().eq('id', userId);
            await signOut();
          },
        },
      ]
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-surface"
      contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 32, gap: 32 }}>
      <ProfileHeader name={profile.full_name} email={email} />

      <Card className="px-4">
        <ListRow
          icon="chat"
          title={t('account.buyer.messages')}
          subtitle={
            unreadCount > 0 ? t('account.buyer.unread', { count: unreadCount }) : t('account.buyer.chatsWithSellers')
          }
          trailing={<CountBadge count={unreadCount} />}
          showChevron
          onPress={() => router.push('/messages')}
          hint={t('account.buyer.messagesHint')}
        />
      </Card>

      <View className="gap-3">
        <SectionHeader title={t('account.personalInfo')} />
        <Card className="px-4">
          <ListRow
            label={t('account.name')}
            value={profile.full_name ?? t('account.notSet')}
            className="border-b-1 border-border"
          />
          <ListRow label={t('auth.email')} value={email} className="border-b-1 border-border" />
          <ListRow
            label={t('account.phone')}
            value={profile.phone ?? t('account.notSet')}
            valueVariant={profile.phone ? 'mono' : 'text'}
            className="border-b-1 border-border"
          />
          <ListRow
            title={t('account.editPersonalInfo')}
            showChevron
            onPress={() => router.push('/account/edit-profile')}
            hint={t('account.editPersonalInfoHint')}
          />
        </Card>
      </View>

      <View className="gap-3">
        <SectionHeader title={t('account.buyer.shippingDetails')} />
        <Card>
          {defaultAddress ? (
            <View className="gap-2 border-b-1 border-border p-4">
              <View className="flex-row items-center gap-2">
                <Text className="type-label-lg text-primary">{defaultAddress.label}</Text>
                {defaultAddress.is_default ? <Badge label={t('account.buyer.default')} /> : null}
              </View>
              <View>
                {formatAddressLines(defaultAddress).map((line) => (
                  <Text key={line} className="type-text-primary text-secondary">
                    {line}
                  </Text>
                ))}
              </View>
            </View>
          ) : (
            <View className="items-center gap-1 border-b-1 border-border p-4">
              <Text className="type-label-lg text-primary">{t('account.buyer.noAddresses')}</Text>
              <Text className="type-text-secondary text-center text-secondary">
                {t('account.buyer.addAddress')}
              </Text>
            </View>
          )}

          <View className="px-4">
            <ListRow
              label={t('address.deliveryPreference')}
              value={
                profile.leave_at_door_default ? t('address.leaveAtDoor') : t('address.handToMe')
              }
              className="border-b-1 border-border"
            />
            <ListRow
              title={t('account.buyer.manageAddresses')}
              showChevron
              onPress={() => router.push('/account/address')}
              hint={t('account.buyer.manageAddressesHint')}
            />
          </View>
        </Card>
      </View>

      <NotificationSettingsCard />

      <View className="gap-3">
        <SectionHeader title={t('accessibility.title')} />
        <Card>
          <View className="border-b-1 border-border p-4">
            <Text className="type-text-primary text-secondary">{t('account.accessibilitySummary')}</Text>
          </View>

          <View className="px-4">
            <ListRow
              label={t('account.featuresOn')}
              value={enabledAccessibilityFeatures(profile)}
              className="border-b-1 border-border"
            />
            <ListRow
              title={t('account.manageAccessibility')}
              showChevron
              onPress={() => router.push('/account/accessibility')}
              hint={t('account.manageAccessibilityHint')}
            />
          </View>
        </Card>
      </View>

      <View className="gap-3">
        <SectionHeader title={t('language.title')} />
        <Card className="px-4">
          <ListRow
            label={t('language.row')}
            value={languageName(i18n.language)}
            className="border-b-1 border-border"
          />
          <ListRow
            title={t('language.manage')}
            showChevron
            onPress={() => router.push('/account/language')}
            hint={t('language.manageHint')}
          />
        </Card>
      </View>

      <View className="gap-3">
        <SectionHeader title={t('account.resetPassword')} />
        <Card className="gap-4 p-4">
          <Text className="type-text-primary text-secondary">
            {t('account.resetLinkInfo', { email })}
          </Text>

          <SuccessBanner message={resetSent ? t('account.resetLinkSent') : null} />
          <FormError message={resetError} />

          <Button
            variant="secondary"
            size="md"
            label={t('account.sendResetLink')}
            fullWidth={false}
            loading={isSendingReset}
            onPress={sendResetLink}
            hint={t('account.sendResetLinkHint')}
          />
        </Card>
      </View>

      <View className="gap-3">
        <Button variant="secondary" label={t('account.signOut')} onPress={confirmSignOut} />
        <Button
          variant="destructive"
          size="md"
          label={t('account.deleteAccount')}
          onPress={confirmDeleteAccount}
          hint={t('account.buyer.deleteHint')}
        />
        <Text className="type-text-secondary text-center text-secondary">
          {t('account.buyer.deleteWarning')}
        </Text>
      </View>
    </ScrollView>
  );
}
