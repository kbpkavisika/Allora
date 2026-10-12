import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { BottomTabBar, type TabDefinition } from '@/components/ui/BottomTabBar';
import { Header } from '@/components/ui/Header';

export default function TabLayout() {
  const { t } = useTranslation();
  const tabs: Record<string, TabDefinition> = {
    index: { label: t('tabs.shop'), icon: 'shop' },
    'cart/index': { label: t('tabs.cart'), icon: 'cart' },
    'saved/index': { label: t('tabs.saved'), icon: 'save' },
    'orders/index': { label: t('tabs.orders'), icon: 'orders' },
    'account/index': { label: t('tabs.account'), icon: 'account' },
  };
  return (
    <Tabs
      screenOptions={{ header: () => <Header /> }}
      tabBar={(props) => <BottomTabBar {...(props as unknown as BottomTabBarProps)} tabs={tabs} />}>
      <Tabs.Screen name="index" options={{ title: t('tabs.shop'), headerShown: false }} />
      <Tabs.Screen name="cart/index" options={{ title: t('tabs.cart') }} />
      <Tabs.Screen name="saved/index" options={{ title: t('tabs.saved') }} />
      <Tabs.Screen name="orders/index" options={{ title: t('tabs.orders') }} />
      <Tabs.Screen name="payment" options={{ title: t('tabs.payment') }} />
      <Tabs.Screen name="account/index" options={{ title: t('tabs.account') }} />
    </Tabs>
  );
}
