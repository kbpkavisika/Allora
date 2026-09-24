import { Text, View } from 'react-native';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { SectionHeader } from '@/components/ui/SectionHeader';
import {
  deliveryStatusPresentation,
  formatDeliveryDate,
  type Delivery,
} from '@/lib/deliveries';

export interface DeliverySummaryProps {
  delivery: Delivery | null;
  onEdit?: () => void;
}

export function DeliverySummary({ delivery, onEdit }: DeliverySummaryProps) {
  const presentation = deliveryStatusPresentation(delivery?.status ?? 'pending');

  const rows = [
    { label: 'Courier', value: delivery?.courier_name },
    { label: 'Tracking number', value: delivery?.tracking_number },
  ].filter((row): row is { label: string; value: string } => Boolean(row.value));

  const caption = delivery?.delivered_at
    ? `Delivered ${formatDeliveryDate(delivery.delivered_at)}`
    : delivery?.estimated_at
      ? `Arriving ${formatDeliveryDate(delivery.estimated_at)}`
      : null;

  return (
    <View className="gap-4">
      <SectionHeader title="Delivery" />

      <View className="gap-3 rounded-12 border-1 border-border bg-surface p-4">
        <Badge label={presentation.label} variant={presentation.variant} />

        {rows.map((row) => (
          <View key={row.label} className="flex-row items-center justify-between gap-3">
            <Text className="type-text-secondary text-secondary">{row.label}</Text>
            <Text className="type-text-primary flex-1 text-right text-primary" numberOfLines={1}>
              {row.value}
            </Text>
          </View>
        ))}

        <Text className="type-text-secondary text-secondary">
          {caption ?? 'Delivery details will appear here once the order is dispatched.'}
        </Text>

        {onEdit ? (
          <Button variant="secondary" size="sm" label="Update delivery" onPress={onEdit} />
        ) : null}
      </View>
    </View>
  );
}
