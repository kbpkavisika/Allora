import { router, useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ReadAloudButton } from '@/components/payment/ReadAloudButton';
import { formatRefundStatusSpeech } from '@/components/payment/paymentSpeech';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Callout } from '@/components/ui/Callout';
import { Icon, type IconName } from '@/components/ui/Icon';
import { TopBar } from '@/components/ui/TopBar';
import { formatMoney } from '@/lib/orders';
import { useOrders } from '@/lib/OrdersProvider';
import { refundService } from '@/services/refund/refundService';
import type { RefundStatus } from '@/services/refund/refundTypes';

const STATUS_CONFIG: Record<
  RefundStatus,
  {
    icon: IconName;
    ring: string;
    iconColor: string;
    badgeLabel: string;
    badgeVariant: 'warning' | 'neutral' | 'success' | 'dark';
    title: string;
    description: string;
  }
> = {
  requested: {
    icon: 'orders',
    ring: 'border-accent bg-accent-tint',
    iconColor: 'text-accent-primary',
    badgeLabel: 'Refund Requested',
    badgeVariant: 'warning',
    title: 'Refund Request Submitted',
    description:
      'Your refund request has been received and is queued for verification with the payment provider.',
  },
  processing: {
    icon: 'orders',
    ring: 'border-info bg-info-tint',
    iconColor: 'text-info',
    badgeLabel: 'Refund Processing',
    badgeVariant: 'neutral',
    title: 'Refund Processing',
    description:
      "Your refund request has been submitted successfully. The refund will be processed according to the payment provider's refund process.",
  },
  refunded: {
    icon: 'check',
    ring: 'border-success bg-success-tint',
    iconColor: 'text-success',
    badgeLabel: 'Refunded',
    badgeVariant: 'success',
    title: 'Refund Completed',
    description: 'The refund amount has been returned to your original payment method.',
  },
  failed: {
    icon: 'close',
    ring: 'border-error bg-error-tint',
    iconColor: 'text-error',
    badgeLabel: 'Refund Failed',
    badgeVariant: 'warning',
    title: 'Refund Request Failed',
    description:
      'We could not process this refund request at this time. Please try again or contact support for assistance.',
  },
};

export default function RefundStatusScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { getOrder } = useOrders();

  const order = id ? getOrder(id) : undefined;
  const refund = id ? refundService.getRefund(id) : undefined;

  const status: RefundStatus = refund?.status ?? 'processing';
  const config = STATUS_CONFIG[status];

  const refundAmount = useMemo(() => {
    if (refund?.refundAmount) return refund.refundAmount;
    if (order?.total) return order.total;
    return 0;
  }, [refund, order]);

  const refundRef = refund?.id ?? `REF-${id?.slice(0, 6).toUpperCase() ?? '000000'}`;
  const paymentRef = refund?.paymentReference || order?.payment_reference || `ORDER-${order?.order_number ?? ''}`;
  const reasonText = refund?.reasonLabel ?? 'General refund';

  if (!order) {
    return (
      <View className="flex-1 bg-surface">
        <TopBar title="Refund Status" />
        <View className="items-center gap-3 p-4 pt-16">
          <Text role="heading" className="type-h3 text-primary">
            Order not found
          </Text>
          <Button
            variant="secondary"
            label="Back to orders"
            fullWidth={false}
            onPress={() => router.replace('/(tabs)/orders')}
          />
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-surface">
      <TopBar title="Refund Status" />

      <ScrollView
        contentContainerStyle={{
          padding: 16,
          paddingTop: 24,
          paddingBottom: insets.bottom + 32,
          gap: 24,
        }}
        showsVerticalScrollIndicator={false}>
        {/* Status Header */}
        <View className="items-center gap-4">
          <View
            className={`h-16 w-16 items-center justify-center rounded-full border-1 ${config.ring}`}>
            <Icon name={config.icon} size="lg" className={config.iconColor} />
          </View>
          <View className="items-center gap-2">
            <Badge label={config.badgeLabel} variant={config.badgeVariant} />
            <Text
              role="heading"
              className="type-h1 text-center text-primary"
              maxFontSizeMultiplier={1.5}>
              {config.title}
            </Text>
            <Text className="type-text-secondary text-center text-secondary">
              {config.description}
            </Text>
          </View>
        </View>

        {status === 'failed' ? (
          <Callout
            tone="warning"
            message="The refund could not be initiated. Your payment method was not affected."
          />
        ) : null}

        {/* Refund Details Card */}
        <View className="gap-3 rounded-12 border-1 border-border bg-surface p-4">
          <Text className="type-mono text-secondary">
            Order {order.order_number} · Reference {refundRef}
          </Text>

          <View className="flex-row items-baseline justify-between border-b-1 border-border pb-3">
            <Text className="type-label-lg text-primary">Refund Amount</Text>
            <Text className="type-h2 text-primary">{formatMoney(refundAmount)}</Text>
          </View>

          <View className="gap-2 pt-1">
            <View className="flex-row items-center justify-between">
              <Text className="type-text-secondary text-secondary">Original Payment Ref</Text>
              <Text className="type-mono text-primary">{paymentRef}</Text>
            </View>

            <View className="flex-row items-center justify-between">
              <Text className="type-text-secondary text-secondary">Reason</Text>
              <Text className="type-text-primary text-primary">{reasonText}</Text>
            </View>

            {refund?.reasonDetails ? (
              <View className="gap-0.5">
                <Text className="type-text-secondary text-secondary">Details</Text>
                <Text className="type-text-primary text-primary">{refund.reasonDetails}</Text>
              </View>
            ) : null}

            <View className="flex-row items-center justify-between">
              <Text className="type-text-secondary text-secondary">Status</Text>
              <Text className="type-label text-primary capitalize">{status}</Text>
            </View>
          </View>

          <ReadAloudButton
            text={formatRefundStatusSpeech({
              status,
              amount: refundAmount,
              currency: 'LKR',
              refundReference: refundRef,
              reason: reasonText,
            })}
            label="Read aloud status"
          />
        </View>

        {/* Action Buttons */}
        <View className="gap-3">
          {status === 'failed' ? (
            <Button
              label="Try Again"
              onPress={() =>
                router.replace({ pathname: '/orders/[id]/refund' as any, params: { id: order.id } })
              }
            />
          ) : (
            <Button
              label="View Order Details"
              variant="secondary"
              onPress={() =>
                router.replace({ pathname: '/orders/[id]' as any, params: { id: order.id } })
              }
            />
          )}

          <Button
            label="Back to Orders"
            variant="secondary"
            onPress={() => router.replace('/(tabs)/orders')}
          />
        </View>
      </ScrollView>
    </View>
  );
}
