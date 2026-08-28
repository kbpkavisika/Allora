import { router } from 'expo-router';
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ListRow } from '@/components/account/ListRow';
import { ProfileHeader } from '@/components/account/ProfileHeader';
import { Button } from '@/components/ui/Button';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { useProfile } from '@/hooks/useProfile';
import { useAuth } from '@/lib/AuthProvider';
import { supabase } from '@/lib/supabase';

export default function SellerAccountScreen() {
  const insets = useSafeAreaInsets();
  const { session } = useAuth();
  const { profile } = useProfile();

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
    Alert.alert('Sign out', 'Signing out keeps your shop details on this device.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: () => supabase.auth.signOut() },
    ]);
  }

  function confirmDeleteAccount() {
    Alert.alert(
      'Delete account',
      'This permanently removes your profile and shop. This cannot be undone.',
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
        <SectionHeader title="Shop" />
        <View className="rounded-12 border-1 border-border bg-surface px-4">
          <ListRow
            title="Shop settings"
            subtitle="Edit your shop name, description, and contact details"
            showChevron
            onPress={() => router.push('/seller/store-details')}
            hint="Opens your shop details form"
          />
        </View>
      </View>

      <View className="gap-4">
        <SectionHeader title="Security" />
        <View className="rounded-12 border-1 border-border bg-surface px-4">
          <ListRow
            title="Reset password"
            showChevron
            onPress={() => router.push('/account/reset-password')}
            hint="Opens the reset password form"
          />
        </View>
      </View>

      <View className="gap-3">
        <Button variant="secondary" label="Sign out" onPress={confirmSignOut} />
        <Text className="type-text-secondary text-center text-secondary">
          Signing out keeps your shop details on this device.
        </Text>
        <Pressable
          onPress={confirmDeleteAccount}
          role="button"
          aria-label="Delete account"
          accessibilityHint="Permanently removes your profile and shop"
          className="min-h-tap items-center justify-center active:bg-surface-muted">
          <Text className="type-label-lg text-error">Delete account</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}
