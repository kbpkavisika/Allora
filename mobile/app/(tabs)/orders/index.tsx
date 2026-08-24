import { useMemo, useState } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { OrderListCard } from '@/components/orders/OrderListCard';
import { mockOrders } from '@/lib/mockOrders';

type OrderFilter = 'active' | 'past';

function FilterChip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      role="radio"
      aria-checked={selected}
      aria-label={label}
      className={`min-h-control-md items-center justify-center rounded-8 px-4 ${
        selected ? 'border-1.5 border-primary bg-surface-sunken' : 'border-1 border-border-strong bg-surface'
      }`}>
      <Text className={`type-label ${selected ? 'text-primary' : 'text-secondary'}`}>{label}</Text>
    </Pressable>
  );
}

export default function OrdersScreen() {
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState<OrderFilter>('active');

  const activeCount = mockOrders.filter((order) => order.status !== 'delivered').length;
  const pastCount = mockOrders.length - activeCount;

  const visibleOrders = useMemo(
    () =>
      mockOrders.filter((order) =>
        filter === 'active' ? order.status !== 'delivered' : order.status === 'delivered'
      ),
    [filter]
  );

  return (
    <View className="flex-1 bg-surface">
      <FlatList
        data={visibleOrders}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 16,
          paddingBottom: insets.bottom + 32,
          gap: 12,
        }}
        ListHeaderComponent={
          <View className="mb-6 gap-4">
            <Text role="heading" className="type-h1 text-primary" maxFontSizeMultiplier={1.5}>
              Orders
            </Text>
            <View className="flex-row gap-2" role="radiogroup" aria-label="Filter orders">
              <FilterChip
                label={`Active (${activeCount})`}
                selected={filter === 'active'}
                onPress={() => setFilter('active')}
              />
              <FilterChip
                label={`Past (${pastCount})`}
                selected={filter === 'past'}
                onPress={() => setFilter('past')}
              />
            </View>
          </View>
        }
        renderItem={({ item }) => <OrderListCard order={item} />}
        ListEmptyComponent={
          <Text className="type-text-primary text-secondary">
            {filter === 'active' ? 'No active orders right now.' : 'No past orders yet.'}
          </Text>
        }
      />
    </View>
  );
}
