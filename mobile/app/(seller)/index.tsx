import { router } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ActionCard } from '@/components/ui/ActionCard';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { useProducts } from '@/hooks/useProducts';
import { useShop } from '@/hooks/useShop';
import { mockOrders } from '@/lib/mockOrders';

const UNREAD_MESSAGES: number = 0;

export default function SellerShopScreen() {
  const insets = useSafeAreaInsets();
  const { shop } = useShop();
  const { products } = useProducts();

  const productCount = products.length;
  const ordersInProgress = mockOrders.filter((order) => order.status !== 'delivered').length;

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
        title="My shop"
        action={
          <Pressable
            onPress={() => router.push('/(seller)/account')}
            role="button"
            aria-label="Profile"
            hitSlop={8}>
            <Text className="type-label-lg text-primary underline">Profile</Text>
          </Pressable>
        }
      />

      <View className="gap-1">
        <Text className="type-text-primary text-primary" maxFontSizeMultiplier={1.5}>
          Today · {ordersInProgress} {ordersInProgress === 1 ? 'order' : 'orders'} in progress ·{' '}
          {UNREAD_MESSAGES} {UNREAD_MESSAGES === 1 ? 'message' : 'messages'}
        </Text>
        <Text className="type-text-secondary text-secondary" maxFontSizeMultiplier={1.5}>
          {shop?.name ? `${shop.name} · ` : ''}Add products, track orders and reply to buyers.
        </Text>
      </View>

      <View className="gap-3">
        <View className="flex-row gap-3">
          <ActionCard
            className="flex-1"
            icon="plus"
            title="Add a product"
            onPress={() => router.push('/seller/add-product')}
          />
          <ActionCard
            className="flex-1"
            icon="orders"
            title="Orders"
            caption={`${ordersInProgress} in progress`}
            onPress={() => router.push('/(seller)/orders')}
          />
        </View>

        <View className="flex-row gap-3">
          <ActionCard
            className="flex-1"
            icon="shop"
            title="My products"
            caption={`${productCount} ${productCount === 1 ? 'item' : 'items'}`}
            onPress={() => router.push('/(seller)/products')}
          />
          <ActionCard
            className="flex-1"
            icon="chat"
            title="Messages"
            caption={`${UNREAD_MESSAGES} unread`}
            onPress={() => router.push('/(seller)/chat')}
          />
        </View>
      </View>
    </ScrollView>
  );
}
