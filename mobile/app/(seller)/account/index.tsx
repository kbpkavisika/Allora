import { useFocusEffect } from '@react-navigation/native';
import { Image } from 'expo-image';
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
import { useProducts } from '@/hooks/useProducts';
import { useProfile } from '@/hooks/useProfile';
import { useShop } from '@/hooks/useShop';
import { useAuth } from '@/lib/AuthProvider';
import { getAuthErrorMessage } from '@/lib/authErrors';
import { enabledAccessibilityFeatures } from '@/lib/profile';
import { supabase } from '@/lib/supabase';

const ACCESSIBILITY_SUMMARY =
  'Large text, high contrast, dictation, screen reader support and reduce motion.';

function fulfilment(pickup: boolean, delivery: boolean): string {
  if (pickup && delivery) return 'Pickup and delivery';
  if (pickup) return 'Pickup only';
  if (delivery) return 'Delivery only';
  return 'Not set';
}

export default function SellerAccountScreen() {
  const insets = useSafeAreaInsets();
  const { session } = useAuth();
  const { profile, refresh } = useProfile();
  const { shop, deleteShop } = useShop();
  const { products } = useProducts();

  const [resetSent, setResetSent] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);
  const [isSendingReset, setIsSendingReset] = useState(false);
  const [shopError, setShopError] = useState<string | null>(null);

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
  const productCount = products.length;

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

  function confirmCloseShop() {
    const listings =
      productCount === 1 ? 'its 1 listing' : `all ${productCount} of its listings`;

    Alert.alert(
      'Close shop',
      `This permanently removes ${shop?.name ?? 'your shop'} and ${listings}. This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Close shop',
          style: 'destructive',
          onPress: async () => {
            setShopError(null);
            const { error } = await deleteShop();
            if (error) setShopError('Could not close your shop. Try again.');
          },
        },
      ]
    );
  }

  function confirmSignOut() {
    Alert.alert('Sign out', 'Signing out keeps your shop and listings.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: () => supabase.auth.signOut() },
    ]);
  }

  function confirmDeleteAccount() {
    Alert.alert(
      'Delete account',
      'This permanently removes your profile, your shop and every listing. This cannot be undone.',
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
        <SectionHeader title="Store details" />
        <Card>
          {shop ? (
            <View className="gap-3 border-b-1 border-border p-4">
              <View className="flex-row items-center gap-3">
                <View className="h-14 w-14 items-center justify-center overflow-hidden rounded-8 bg-surface-sunken">
                  {shop.photo_url ? (
                    <Image
                      source={{ uri: shop.photo_url }}
                      style={{ width: '100%', height: '100%' }}
                      contentFit="cover"
                    />
                  ) : (
                    <Text className="type-label-sm text-secondary">No photo</Text>
                  )}
                </View>

                <View className="flex-1 gap-1">
                  <Text className="type-label-lg text-primary" numberOfLines={1}>
                    {shop.name}
                  </Text>
                  <Text className="type-text-secondary text-secondary" numberOfLines={1}>
                    {shop.category}
                  </Text>
                </View>

                <Badge
                  label={`${productCount} ${productCount === 1 ? 'listing' : 'listings'}`}
                />
              </View>
            </View>
          ) : (
            <View className="items-center gap-1 border-b-1 border-border p-4">
              <Text className="type-label-lg text-primary">No shop yet</Text>
              <Text className="type-text-secondary text-center text-secondary">
                Set one up to start listing products.
              </Text>
            </View>
          )}

          <View className="px-4">
            <ListRow
              label="Location"
              value={shop?.city ?? 'Not set'}
              className="border-b-1 border-border"
            />
            <ListRow
              label="Phone"
              value={shop?.phone ?? 'Not set'}
              valueVariant={shop?.phone ? 'mono' : 'text'}
              className="border-b-1 border-border"
            />
            <ListRow
              label="Fulfilment"
              value={fulfilment(shop?.pickup_enabled ?? false, shop?.delivery_enabled ?? false)}
              className="border-b-1 border-border"
            />
            <ListRow
              title="Manage store details"
              showChevron
              onPress={() => router.push('/seller/store-details')}
              hint="Opens the store details form"
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

        <FormError message={shopError} />

        {shop ? (
          <Button
            variant="destructive"
            size="md"
            label="Close shop"
            onPress={confirmCloseShop}
            hint="Permanently removes your shop and every listing"
          />
        ) : null}

        <Button
          variant="destructive"
          size="md"
          label="Delete account"
          onPress={confirmDeleteAccount}
          hint="Permanently removes your profile, shop and listings"
        />

        <Text className="type-text-secondary text-center text-secondary">
          {`Closing your shop removes its listings but keeps your account. Deleting removes everything. Neither can be undone.`}
        </Text>
      </View>
    </ScrollView>
  );
}
