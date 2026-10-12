import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
  const presentation = deliveryStatusPresentation(delivery?.status ?? 'pending');

  const rows = [
    { label: t('delivery.courier'), value: delivery?.courier_name },
    { label: t('delivery.trackingNumber'), value: delivery?.tracking_number },
  ].filter((row): row is { label: string; value: string } => Boolean(row.value));

  const caption = delivery?.delivered_at
    ? t('delivery.deliveredOn', { date: formatDeliveryDate(delivery.delivered_at) })
    : delivery?.estimated_at
      ? t('delivery.arriving', { date: formatDeliveryDate(delivery.estimated_at) })
      : null;

  return (
    <View className="gap-4">
      <SectionHeader title={t('delivery.title')} />

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
          {caption ?? t('delivery.pending')}
        </Text>

        {onEdit ? (
          <Button variant="secondary" size="sm" label={t('delivery.update')} onPress={onEdit} />
        ) : null}
      </View>
    </View>
  );
}
