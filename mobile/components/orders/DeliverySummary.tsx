import { Text, View } from 'react-native';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Callout } from '@/components/ui/Callout';
import { SectionHeader } from '@/components/ui/SectionHeader';
import {
  deliveryIssueLabel,
  deliveryStatusPresentation,
  formatDeliveryDate,
  type Delivery,
  type DeliveryIssue,
} from '@/lib/deliveries';

export interface DeliverySummaryProps {
  delivery: Delivery | null;
  issue?: DeliveryIssue | null;
  onEdit?: () => void;
  onReport?: () => void;
  onResolve?: () => void;
  isResolving?: boolean;
}

export function DeliverySummary({
  delivery,
  issue,
  onEdit,
  onReport,
  onResolve,
  isResolving = false,
}: DeliverySummaryProps) {
  const presentation = deliveryStatusPresentation(delivery?.status ?? 'pending');

  const stamp = (value: string | null | undefined) =>
    value ? formatDeliveryDate(value) : undefined;

  const rows = [
    { label: 'Courier', value: delivery?.courier_name },
    { label: 'Tracking number', value: delivery?.tracking_number },
    { label: 'Packed', value: stamp(delivery?.packed_at) },
    { label: 'Shipped', value: stamp(delivery?.shipped_at) },
    { label: 'Delivered', value: stamp(delivery?.delivered_at) },
  ].filter((row): row is { label: string; value: string } => Boolean(row.value));

  const caption =
    !delivery?.delivered_at && delivery?.estimated_at
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

        {caption || rows.length === 0 ? (
          <Text className="type-text-secondary text-secondary">
            {caption ?? 'Delivery details will appear here once the order is dispatched.'}
          </Text>
        ) : null}

        {issue ? (
          <View className="gap-2">
            <Callout tone="warning" message={`Reported: ${deliveryIssueLabel(issue.kind)}`} />
            {issue.details ? (
              <Text className="type-text-secondary text-secondary">{issue.details}</Text>
            ) : null}
            {onResolve ? (
              <Button
                variant="secondary"
                size="sm"
                label="Mark as resolved"
                loading={isResolving}
                onPress={onResolve}
              />
            ) : null}
          </View>
        ) : null}

        {onEdit ? (
          <Button variant="secondary" size="sm" label="Update delivery" onPress={onEdit} />
        ) : null}

        {onReport && !issue ? (
          <Button
            variant="secondary"
            size="sm"
            label="Report a problem"
            onPress={onReport}
            hint="Tells the seller something went wrong with this delivery"
          />
        ) : null}
      </View>
    </View>
  );
}
