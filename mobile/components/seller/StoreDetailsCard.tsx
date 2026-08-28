import { View } from 'react-native';

import { ListRow } from '@/components/account/ListRow';
import { Toggle } from '@/components/ui/Toggle';
import type { Shop } from '@/lib/shop';

export interface StoreDetailsCardProps {
  shop: Shop;
  onEdit: () => void;
  onTogglePickup: (value: boolean) => void;
  onToggleDelivery: (value: boolean) => void;
}

export function StoreDetailsCard({
  shop,
  onEdit,
  onTogglePickup,
  onToggleDelivery,
}: StoreDetailsCardProps) {
  return (
    <View className="rounded-12 border-1 border-border bg-surface px-4">
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
  );
}
