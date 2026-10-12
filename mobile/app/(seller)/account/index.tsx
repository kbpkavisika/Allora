import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ListRow } from '@/components/account/ListRow';
import { NotificationSettingsCard } from '@/components/account/NotificationSettingsCard';
import { ProfileHeader } from '@/components/account/ProfileHeader';
import { StoreDetailsCard } from '@/components/seller/StoreDetailsCard';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { FormError } from '@/components/ui/FormError';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { SuccessBanner } from '@/components/ui/SuccessBanner';
import { useProfile } from '@/hooks/useProfile';
import { useShop } from '@/hooks/useShop';
import { signOut, useAuth } from '@/lib/AuthProvider';
import { getAuthErrorMessage } from '@/lib/authErrors';
import { enabledAccessibilityFeatures, memberSince } from '@/lib/profile';
import { supabase } from '@/lib/supabase';
import { languageName } from '@/lib/i18n';

export default function SellerAccountScreen() {
  const { t, i18n } = useTranslation();
  const insets = useSafeAreaInsets();
  const { session } = useAuth();
  const { profile, refresh } = useProfile();
  const { shop, saveShop } = useShop();

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

  const editStore = () => router.push('/seller/store-details');

  async function setFulfilment(patch: { pickup_enabled?: boolean; delivery_enabled?: boolean }) {
    if (!shop) return;

    const next = {
      pickup_enabled: patch.pickup_enabled ?? shop.pickup_enabled,
      delivery_enabled: patch.delivery_enabled ?? shop.delivery_enabled,
    };

    if (!next.pickup_enabled && !next.delivery_enabled) {
      setShopError(t('account.seller.lastFulfilment'));
      return;
    }

    setShopError(null);

    const { error } = await saveShop({
      name: shop.name,
      category: shop.category,
      city: shop.city,
      phone: shop.phone,
      photo_url: shop.photo_url,
      ...next,
    });

    if (error) setShopError(t('account.seller.saveError'));
  }

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
    Alert.alert(t('account.signOut'), t('account.seller.signOutBody'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('account.signOut'), style: 'destructive', onPress: () => signOut() },
    ]);
  }

  function confirmDeleteAccount() {
    Alert.alert(
      t('account.deleteAccount'),
      t('account.seller.deleteBody'),
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
            label={t('account.seller.accountType')}
            value={profile.role === 'seller' ? t('account.seller.seller') : t('account.seller.buyer')}
            className="border-b-1 border-border"
          />
          <ListRow
            label={t('account.seller.memberSince')}
            value={memberSince(profile.created_at)}
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
        <SectionHeader title={t('account.seller.storeDetails')} />

        {shop ? (
          <StoreDetailsCard
            shop={shop}
            onEdit={editStore}
            onTogglePickup={(value) => setFulfilment({ pickup_enabled: value })}
            onToggleDelivery={(value) => setFulfilment({ delivery_enabled: value })}
          />
        ) : (
          <Card className="items-center gap-1 p-4">
            <Text className="type-label-lg text-primary">{t('account.seller.noShop')}</Text>
            <Text className="type-text-secondary text-center text-secondary">
              {t('account.seller.setUpShop')}
            </Text>
          </Card>
        )}

        <FormError message={shopError} />
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
          hint={t('account.seller.deleteHint')}
        />
        <Text className="type-text-secondary text-center text-secondary">
          {t('account.seller.deleteWarning')}
        </Text>
      </View>
    </ScrollView>
  );
}
