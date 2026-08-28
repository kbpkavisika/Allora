import { Tabs } from 'expo-router';

import { BottomTabBar, type TabDefinition } from '@/components/ui/BottomTabBar';
import { Header } from '@/components/ui/Header';

const BUYER_TABS: Record<string, TabDefinition> = {
  index: { label: 'Shop', icon: 'shop' },
  'cart/index': { label: 'Cart', icon: 'cart' },
  'saved/index': { label: 'Saved', icon: 'save' },
  'orders/index': { label: 'Orders', icon: 'orders' },
  'account/index': { label: 'Account', icon: 'account' },
};

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{ header: () => <Header /> }}
      tabBar={(props) => <BottomTabBar {...props} tabs={BUYER_TABS} />}>
      <Tabs.Screen name="index" options={{ title: 'Shop', headerShown: false }} />
      <Tabs.Screen name="cart/index" options={{ title: 'Cart' }} />
      <Tabs.Screen name="saved/index" options={{ title: 'Saved' }} />
      <Tabs.Screen name="orders/index" options={{ title: 'Orders' }} />
      <Tabs.Screen name="account/index" options={{ title: 'Account' }} />
    </Tabs>
  );
}
