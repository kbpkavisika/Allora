import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ListRow } from '@/components/account/ListRow';
import { ProfileHeader } from '@/components/account/ProfileHeader';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { FormError } from '@/components/ui/FormError';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { SuccessBanner } from '@/components/ui/SuccessBanner';
import { useProfile } from '@/hooks/useProfile';
import { useAuth } from '@/lib/AuthProvider';
import { getAuthErrorMessage } from '@/lib/authErrors';
import { enabledAccessibilityFeatures, formatAddressLines } from '@/lib/profile';
import { supabase } from '@/lib/supabase';

const ACCESSIBILITY_SUMMARY =
  'Large text, high contrast, dictation, screen reader support and reduce motion.';

export default function AccountScreen() {
  const insets = useSafeAreaInsets();
  const { session } = useAuth();
  const { profile, addresses, refresh } = useProfile();
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
    Alert.alert('Sign out', 'Signing out keeps your saved items on this device.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: () => supabase.auth.signOut() },
    ]);
  }

  function confirmDeleteAccount() {
    Alert.alert(
      'Delete account',
      'This permanently removes your profile and saved addresses. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete account',
          style: 'destructive',
          onPress: async () => {
            await supabase.from('profiles').delete().eq('id', userId);
            await supabase.auth.signOut();
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

      <View className="gap-3">
        <SectionHeader title="Personal info" />
        <Card className="px-4">
          <ListRow
            label="Name"
            value={profile.full_name ?? 'Not set'}
            className="border-b-1 border-border"
          />
          <ListRow label="Email" value={email} className="border-b-1 border-border" />
          <ListRow
            label="Phone"
            value={profile.phone ?? 'Not set'}
            valueVariant={profile.phone ? 'mono' : 'text'}
            className="border-b-1 border-border"
          />
          <ListRow
            title="Edit personal info"
            showChevron
            onPress={() => router.push('/account/edit-profile')}
            hint="Opens the personal info form"
          />
        </Card>
      </View>

      <View className="gap-3">
        <SectionHeader title="Shipping details" />
        <Card>
          {defaultAddress ? (
            <View className="gap-2 border-b-1 border-border p-4">
              <View className="flex-row items-center gap-2">
                <Text className="type-label-lg text-primary">{defaultAddress.label}</Text>
                {defaultAddress.is_default ? <Badge label="Default" /> : null}
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
              <Text className="type-label-lg text-primary">No saved addresses yet</Text>
              <Text className="type-text-secondary text-center text-secondary">
                Add one to speed up checkout.
              </Text>
            </View>
          )}

          <View className="px-4">
            <ListRow
              label="Delivery preference"
              value={profile.leave_at_door_default ? 'Leave at door' : 'Hand to me'}
              className="border-b-1 border-border"
            />
            <ListRow
              title="Manage addresses"
              showChevron
              onPress={() => router.push('/account/address')}
              hint="Opens the shipping address form"
            />
          </View>
        </Card>
      </View>

      <View className="gap-3">
        <SectionHeader title="Accessibility" />
        <Card>
          <View className="border-b-1 border-border p-4">
            <Text className="type-text-primary text-secondary">{ACCESSIBILITY_SUMMARY}</Text>
          </View>

          <View className="px-4">
            <ListRow
              label="Features on"
              value={enabledAccessibilityFeatures(profile)}
              className="border-b-1 border-border"
            />
            <ListRow
              title="Manage accessibility"
              showChevron
              onPress={() => router.push('/account/accessibility')}
              hint="Opens the accessibility settings"
            />
          </View>
        </Card>
      </View>

      <View className="gap-3">
        <SectionHeader title="Reset password" />
        <Card className="gap-4 p-4">
          <Text className="type-text-primary text-secondary">
            {`We'll email a reset link to ${email}. The link stays valid for 30 minutes.`}
          </Text>

          <SuccessBanner message={resetSent ? 'Reset link sent. Check your inbox.' : null} />
          <FormError message={resetError} />

          <Button
            variant="secondary"
            size="md"
            label="Send reset link"
            fullWidth={false}
            loading={isSendingReset}
            onPress={sendResetLink}
            hint="Emails you a link to choose a new password"
          />
        </Card>
      </View>

      <View className="gap-3">
        <Button variant="secondary" label="Sign out" onPress={confirmSignOut} />
        <Button
          variant="destructive"
          size="md"
          label="Delete account"
          onPress={confirmDeleteAccount}
          hint="Permanently removes your profile and saved addresses"
        />
        <Text className="type-text-secondary text-center text-secondary">
          {`Deleting removes your orders, saved items and addresses. This can't be undone.`}
        </Text>
      </View>
    </ScrollView>
  );
}
