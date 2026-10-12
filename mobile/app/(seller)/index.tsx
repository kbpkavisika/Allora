import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ActionCard } from '@/components/ui/ActionCard';
import { Button } from '@/components/ui/Button';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { useOrders } from '@/hooks/useOrders';
import { useProducts } from '@/hooks/useProducts';
import { useShop } from '@/hooks/useShop';

const UNREAD_MESSAGES: number = 0;

export default function SellerShopScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { shop } = useShop();
  const { products } = useProducts();
  const { orders } = useOrders();

  const productCount = products.length;
  const ordersInProgress = orders.filter((order) => order.status !== 'completed').length;

  return (
    <ScrollView
      className="flex-1 bg-surface"
      contentContainerStyle={{
        paddingHorizontal: 16,
        paddingTop: insets.top + 8,
        paddingBottom: insets.bottom + 32,
        gap: 24,
      }}>
      <SectionHeader
        title={t('seller.home.title')}
        action={
          <Pressable
            onPress={() => router.push('/(seller)/account')}
            role="button"
            aria-label={t('seller.home.profile')}
            hitSlop={8}>
            <Text className="type-label-lg text-primary underline">{t('seller.home.profile')}</Text>
          </Pressable>
        }
      />

      <View className="gap-1">
        <Text className="type-text-primary text-primary" maxFontSizeMultiplier={1.5}>
          {t('seller.home.today', {
            orders: t('seller.home.ordersInProgress', { count: ordersInProgress }),
            messages: t('seller.home.messages', { count: UNREAD_MESSAGES }),
          })}
        </Text>
        <Text className="type-text-secondary text-secondary" maxFontSizeMultiplier={1.5}>
          {shop?.name ? `${shop.name} · ` : ''}
          {t('seller.home.tagline')}
        </Text>
      </View>

      <View className="gap-3">
        <View className="flex-row gap-3">
          <ActionCard
            className="flex-1"
            icon="plus"
            title={t('seller.home.addProduct')}
            onPress={() => router.push('/seller/add-product')}
          />
          <ActionCard
            className="flex-1"
            icon="orders"
            title={t('tabs.orders')}
            caption={t('seller.home.inProgress', { count: ordersInProgress })}
            onPress={() => router.push('/(seller)/orders')}
          />
        </View>

        <View className="flex-row gap-3">
          <ActionCard
            className="flex-1"
            icon="shop"
            title={t('tabs.myProducts')}
            caption={t('seller.home.items', { count: productCount })}
            onPress={() => router.push('/(seller)/products')}
          />
          <ActionCard
            className="flex-1"
            icon="chat"
            title={t('account.buyer.messages')}
            caption={t('account.buyer.unread', { count: UNREAD_MESSAGES })}
            onPress={() => router.push('/(seller)/chat')}
          />
        </View>
      </View>

      <Button
        variant="secondary"
        label={t('seller.home.quickStock')}
        disabled={productCount === 0}
        onPress={() => router.push('/seller/quick-stock')}
      />
    </ScrollView>
  );
}
