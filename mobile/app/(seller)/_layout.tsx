import { Redirect, Tabs } from 'expo-router';

import { BottomTabBar, type TabDefinition } from '@/components/ui/BottomTabBar';
import { Header } from '@/components/ui/Header';
import { useShop } from '@/hooks/useShop';

const SELLER_TABS: Record<string, TabDefinition> = {
  index: { label: 'Shop', icon: 'shop' },
  'orders/index': { label: 'Orders', icon: 'orders' },
  'chat/index': { label: 'Chat', icon: 'chat' },
  'account/index': { label: 'Account', icon: 'account' },
};

export default function SellerTabLayout() {
  const { shop, isLoading } = useShop();

  if (!isLoading && !shop) {
    return <Redirect href="/seller/store-setup" />;
  }

  return (
    <Tabs
      screenOptions={{ header: () => <Header /> }}
      tabBar={(props) => <BottomTabBar {...props} tabs={SELLER_TABS} />}>
      <Tabs.Screen name="index" options={{ title: 'Shop', headerShown: false }} />
      <Tabs.Screen name="orders/index" options={{ title: 'Orders', headerShown: false }} />
      <Tabs.Screen name="chat/index" options={{ title: 'Chat' }} />
      <Tabs.Screen name="account/index" options={{ title: 'Account' }} />
      {/* Reached from the dashboard, not the tab bar: BottomTabBar skips routes SELLER_TABS omits. */}
      <Tabs.Screen name="products" options={{ title: 'My products', headerShown: false }} />
    </Tabs>
  );
}
