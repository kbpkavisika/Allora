import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Redirect, Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { BottomTabBar, type TabDefinition } from '@/components/ui/BottomTabBar';
import { Header } from '@/components/ui/Header';
import { useChat } from '@/hooks/useChat';
import { useShop } from '@/hooks/useShop';

export default function SellerTabLayout() {
  const { t } = useTranslation();
  const tabs: Record<string, TabDefinition> = {
    index: { label: t('tabs.shop'), icon: 'shop' },
    'orders/index': { label: t('tabs.orders'), icon: 'orders' },
    'chat/index': { label: t('tabs.chat'), icon: 'chat' },
    'account/index': { label: t('tabs.account'), icon: 'account' },
  };
  const { shop, isLoading } = useShop();
  const { unreadCount } = useChat();

  if (!isLoading && !shop) {
    return <Redirect href="/seller/store-setup" />;
  }

  return (
    <Tabs
      screenOptions={{ header: () => <Header /> }}
      tabBar={(props) => (
        <BottomTabBar
          {...(props as unknown as BottomTabBarProps)}
          tabs={tabs}
          badges={{ 'chat/index': unreadCount }}
        />
      )}>
      <Tabs.Screen name="index" options={{ title: t('tabs.shop'), headerShown: false }} />
      <Tabs.Screen name="orders/index" options={{ title: t('tabs.orders'), headerShown: false }} />
      <Tabs.Screen name="chat/index" options={{ title: t('tabs.chat') }} />
      <Tabs.Screen name="account/index" options={{ title: t('tabs.account') }} />
      {/* Reached from the dashboard, not the tab bar: BottomTabBar skips routes SELLER_TABS omits. */}
      <Tabs.Screen name="products" options={{ title: t('tabs.myProducts'), headerShown: false }} />
    </Tabs>
  );
}
