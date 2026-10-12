import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { ListRow } from '@/components/account/ListRow';
import { Toggle } from '@/components/ui/Toggle';
import type { Shop } from '@/lib/shop';
import { translateOption } from '@/lib/i18n';

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
  const { t } = useTranslation();

  return (
    <View className="rounded-12 border-1 border-border bg-surface px-4">
      <ListRow
        label={t('store.name')}
        value={shop.name}
        showChevron
        onPress={onEdit}
        hint={t('storeCard.nameHint')}
        className="border-b-1 border-border"
      />
      <ListRow
        label={t('productForm.category')}
        value={translateOption(shop.category)}
        showChevron
        onPress={onEdit}
        hint={t('storeCard.categoryHint')}
        className="border-b-1 border-border"
      />
      <ListRow
        label={t('storeCard.location')}
        value={shop.city}
        showChevron
        onPress={onEdit}
        hint={t('storeCard.locationHint')}
        className="border-b-1 border-border"
      />
      <ListRow
        label={t('account.phone')}
        value={shop.phone}
        valueVariant="mono"
        showChevron
        onPress={onEdit}
        hint={t('storeCard.phoneHint')}
        className="border-b-1 border-border"
      />
      <ListRow
        label={t('store.photo')}
        value={shop.photo_url ? t('storeCard.added') : t('account.notSet')}
        showChevron
        onPress={onEdit}
        hint={t('storeCard.photoHint')}
        className="border-b-1 border-border"
      />

      <ListRow
        title={t('storeCard.pickup')}
        subtitle={t('store.pickupDescription')}
        trailing={
          <Toggle
            label={t('storeCard.pickup')}
            value={shop.pickup_enabled}
            onValueChange={onTogglePickup}
          />
        }
        className="border-b-1 border-border"
      />
      <ListRow
        title={t('delivery.title')}
        subtitle={t('store.deliveryDescription')}
        trailing={
          <Toggle
            label={t('delivery.title')}
            value={shop.delivery_enabled}
            onValueChange={onToggleDelivery}
          />
        }
      />
    </View>
  );
}
