import { Image } from 'expo-image';
import { Text, View } from 'react-native';

import { ListRow } from '@/components/account/ListRow';
import { Badge } from '@/components/ui/Badge';
import { Toggle } from '@/components/ui/Toggle';
import type { Shop } from '@/lib/shop';

export interface StoreDetailsCardProps {
  shop: Shop;
  productCount: number;
  onEdit: () => void;
  onTogglePickup: (value: boolean) => void;
  onToggleDelivery: (value: boolean) => void;
}

export function StoreDetailsCard({
  shop,
  productCount,
  onEdit,
  onTogglePickup,
  onToggleDelivery,
}: StoreDetailsCardProps) {
  return (
    <View className="overflow-hidden rounded-12 border-1 border-border bg-surface">
      <View className="flex-row items-center gap-3 border-b-1 border-border p-4">
        <View className="h-14 w-14 items-center justify-center overflow-hidden rounded-8 bg-surface-sunken">
          {shop.photo_url ? (
            <Image
              source={{ uri: shop.photo_url }}
              style={{ width: '100%', height: '100%' }}
              contentFit="cover"
            />
          ) : (
            <Text className="type-label-sm text-secondary">No photo</Text>
          )}
        </View>

        <View className="flex-1 gap-0.5">
          <Text className="type-h3 text-primary" numberOfLines={1}>
            {shop.name}
          </Text>
          <Text className="type-text-secondary text-secondary" numberOfLines={1}>
            {shop.category}
          </Text>
        </View>

        <Badge label={`${productCount} ${productCount === 1 ? 'listing' : 'listings'}`} />
      </View>

      <View className="px-4">
        <ListRow
          label="Shop name"
          value={shop.name}
          showChevron
          onPress={onEdit}
          hint="Edits your shop name"
          className="border-b-1 border-border"
        />
        <ListRow
          label="Category"
          value={shop.category}
          showChevron
          onPress={onEdit}
          hint="Edits what your shop sells"
          className="border-b-1 border-border"
        />
        <ListRow
          label="Location"
          value={shop.city}
          showChevron
          onPress={onEdit}
          hint="Edits your shop location"
          className="border-b-1 border-border"
        />
        <ListRow
          label="Phone"
          value={shop.phone}
          valueVariant="mono"
          showChevron
          onPress={onEdit}
          hint="Edits your shop phone number"
          className="border-b-1 border-border"
        />
        <ListRow
          label="Shop photo"
          value={shop.photo_url ? 'Added' : 'Not set'}
          showChevron
          onPress={onEdit}
          hint="Changes your shop photo"
          className="border-b-1 border-border"
        />

        <ListRow
          title="Pickup for buyers"
          subtitle="Buyers nearby can collect orders directly"
          trailing={
            <Toggle
              label="Pickup for buyers"
              value={shop.pickup_enabled}
              onValueChange={onTogglePickup}
            />
          }
          className="border-b-1 border-border"
        />
        <ListRow
          title="Delivery"
          subtitle="Show shipping options at checkout"
          trailing={
            <Toggle
              label="Delivery"
              value={shop.delivery_enabled}
              onValueChange={onToggleDelivery}
            />
          }
        />
      </View>
    </View>
  );
}
