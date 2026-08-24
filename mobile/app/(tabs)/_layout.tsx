import { Tabs } from 'expo-router';

import { BottomTabBar } from '@/components/ui/BottomTabBar';
import { Header } from '@/components/ui/Header';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{ header: () => <Header /> }}
      tabBar={(props) => <BottomTabBar {...props} />}>
      <Tabs.Screen name="index" options={{ title: 'Shop' }} />
      <Tabs.Screen name="cart/index" options={{ title: 'Cart' }} />
      <Tabs.Screen name="saved/index" options={{ title: 'Saved' }} />
      <Tabs.Screen name="orders/index" options={{ title: 'Orders' }} />
      <Tabs.Screen name="account/index" options={{ title: 'Account' }} />
    </Tabs>
  );
}
