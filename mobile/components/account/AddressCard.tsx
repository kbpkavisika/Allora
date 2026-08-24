import { Text, View } from 'react-native';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import type { Address } from '@/lib/profile';

export interface AddressCardProps {
  address: Address;
  onEdit: () => void;
}

export function AddressCard({ address, onEdit }: AddressCardProps) {
  return (
    <View className="gap-3 rounded-12 border-1 border-border bg-surface p-4">
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-2">
          <Text className="type-h3 text-primary">{address.label}</Text>
          {address.is_default ? <Badge label="Default" variant="dark" /> : null}
        </View>
        <Button
          variant="link"
          label="Edit"
          fullWidth={false}
          onPress={onEdit}
          hint={`Edits the ${address.label} address`}
        />
      </View>

      <View>
        <Text className="type-text-primary text-primary">
          {address.line1}
          {address.line2 ? `, ${address.line2}` : ''}
        </Text>
        <Text className="type-text-primary text-primary">
          {address.city}, {address.region} {address.postal_code}
        </Text>
        <Text className="type-text-primary text-primary">{address.country}</Text>
      </View>

      {address.delivery_note ? (
        <Text className="type-text-secondary text-secondary">{address.delivery_note}</Text>
      ) : null}
    </View>
  );
}
