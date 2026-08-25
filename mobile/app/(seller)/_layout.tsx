import { Tabs } from 'expo-router';

import { BottomTabBar, type TabDefinition } from '@/components/ui/BottomTabBar';
import { Header } from '@/components/ui/Header';

const SELLER_TABS: Record<string, TabDefinition> = {
  index: { label: 'Shop', icon: 'shop' },
  'chat/index': { label: 'Chat', icon: 'chat' },
  'orders/index': { label: 'Orders', icon: 'orders' },
  'account/index': { label: 'Account', icon: 'account' },
};

export default function SellerTabLayout() {
  return (
    <Tabs
      screenOptions={{ header: () => <Header /> }}
      tabBar={(props) => <BottomTabBar {...props} tabs={SELLER_TABS} />}>
      <Tabs.Screen name="index" options={{ title: 'Shop' }} />
      <Tabs.Screen name="chat/index" options={{ title: 'Chat' }} />
      <Tabs.Screen name="orders/index" options={{ title: 'Orders' }} />
      <Tabs.Screen name="account/index" options={{ title: 'Account' }} />
    </Tabs>
  );
}
