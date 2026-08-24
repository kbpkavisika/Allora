import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import { useCallback } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AccountDetailsCard } from '@/components/account/AccountDetailsCard';
import { AddressCard } from '@/components/account/AddressCard';
import { ListRow } from '@/components/account/ListRow';
import { ProfileHeader } from '@/components/account/ProfileHeader';
import { SecuritySection } from '@/components/account/SecuritySection';
import { Button } from '@/components/ui/Button';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Toggle } from '@/components/ui/Toggle';
import { useProfile } from '@/hooks/useProfile';
import { useAuth } from '@/lib/AuthProvider';
import { nextCarrier } from '@/lib/profile';
import { supabase } from '@/lib/supabase';

export default function AccountScreen() {
  const insets = useSafeAreaInsets();
  const { session } = useAuth();
  const { profile, addresses, updateProfile, refresh } = useProfile();

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
      <ProfileHeader
        name={profile.full_name}
        email={email}
        onEdit={() => router.push('/account/edit-profile')}
      />

      <View className="gap-4">
        <SectionHeader title="Account details" />
        <AccountDetailsCard
          profile={profile}
          email={email}
          onEditName={() => router.push('/account/edit-profile')}
          onEditPhone={() => router.push('/account/edit-profile')}
          onToggleSms={(value) => updateProfile({ sms_order_updates: value })}
        />
      </View>

      <View className="gap-4">
        <SectionHeader
          title="Shipping details"
          action={
            <Button
              variant="link"
              label="Add new"
              fullWidth={false}
              onPress={() => router.push('/account/address')}
              hint="Opens the new address form"
            />
          }
        />

        {addresses.length > 0 ? (
          <View className="gap-3">
            {addresses.map((address) => (
              <AddressCard
                key={address.id}
                address={address}
                onEdit={() =>
                  router.push({ pathname: '/account/address', params: { id: address.id } })
                }
              />
            ))}
          </View>
        ) : (
          <View className="items-center gap-1 rounded-12 border-1 border-border bg-surface-muted px-4 py-6">
            <Text className="type-label-lg text-primary">No saved addresses yet</Text>
            <Text className="type-text-secondary text-center text-secondary">
              Add one to speed up checkout.
            </Text>
          </View>
        )}

        <View className="rounded-12 border-1 border-border bg-surface px-4">
          <ListRow
            label="Preferred carrier"
            value={profile.preferred_carrier}
            showChevron
            onPress={() => updateProfile({ preferred_carrier: nextCarrier(profile.preferred_carrier) })}
            hint="Cycles through available carriers"
            className="border-b-1 border-border"
          />
          <ListRow
            title="Leave at door"
            subtitle="Applies to every new order"
            trailing={
              <Toggle
                label="Leave at door"
                value={profile.leave_at_door_default}
                onValueChange={(value) => updateProfile({ leave_at_door_default: value })}
              />
            }
          />
        </View>
      </View>

      <View className="gap-4">
        <SectionHeader title="Security" />
        <SecuritySection
          profile={profile}
          onResetPassword={() => router.push('/account/reset-password')}
          onToggleTwoFactor={() => updateProfile({ two_factor_enabled: !profile.two_factor_enabled })}
        />
      </View>

      <View className="gap-3">
        <Button variant="secondary" label="Sign out" onPress={confirmSignOut} />
        <Text className="type-text-secondary text-center text-secondary">
          Signing out keeps your saved items on this device.
        </Text>
        <Pressable
          onPress={confirmDeleteAccount}
          role="button"
          aria-label="Delete account"
          accessibilityHint="Permanently removes your profile and saved addresses"
          className="min-h-tap items-center justify-center active:bg-surface-muted">
          <Text className="type-label-lg text-error">Delete account</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}
