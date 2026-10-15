import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { AccessibilityInfo, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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
    badgeVariant: 'neutral',
    title: 'Refund Request Submitted',
    description:
      'Your refund request has been received and is queued for verification by the seller.',
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
    badgeLabel: 'Refund Completed',
    badgeVariant: 'success',
    title: 'Refund Completed',
    description: 'The refund amount has been returned to your original payment method.',
  },
  failed: {
    icon: 'close',
    ring: 'border-error bg-error-tint',
    iconColor: 'text-error',
    badgeLabel: 'Refund Declined',
    badgeVariant: 'warning',
    title: 'Refund Request Declined',
    description:
      'The seller could not approve this refund request. Please contact the seller or support for assistance.',
  },
};

export default function RefundStatusScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { getOrder } = useOrders();
  const hasAnnouncedRef = useRef(false);

  const order = id ? getOrder(id) : undefined;
  const [currentRefund, setCurrentRefund] = useState(id ? refundService.getRefund(id) : undefined);
  const refund = currentRefund ?? (id ? refundService.getRefund(id) : undefined);

  useEffect(() => {
    if (order?.id && !currentRefund) {
      void refundService.fetchRefundsForOrder(order.id, order.order_number).then((list) => {
        if (list.length > 0) {
          setCurrentRefund(list[list.length - 1]);
        }
      });
    }
  }, [order?.id, order?.order_number, currentRefund]);

  const refundAmount = useMemo(() => {
    if (refund?.refundAmount) return refund.refundAmount;
    if (order?.total) return order.total;
    return 0;
  }, [refund, order]);

  const refundRef = refund?.id ?? `REF-${id?.slice(0, 6).toUpperCase() ?? '000000'}`;
  const paymentRef =
    refund?.paymentReference || order?.payment_reference || `ORDER-${order?.order_number ?? ''}`;
  const reasonText = refund?.reasonLabel ?? 'General refund';

  useEffect(() => {
    if (!refund || hasAnnouncedRef.current) return;
    hasAnnouncedRef.current = true;

    if (refund.status === 'refunded') {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      AccessibilityInfo.announceForAccessibility(
        `Refund completed. ${formatMoney(refundAmount)} has been refunded. Reference ${refundRef}.`
      );
    } else if (refund.status === 'failed') {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      AccessibilityInfo.announceForAccessibility(
        `Refund request was declined for ${formatMoney(refundAmount)}.`
      );
    } else if (refund.status === 'requested') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      AccessibilityInfo.announceForAccessibility(
        `Refund request submitted for ${formatMoney(refundAmount)}. Reference ${refundRef}.`
      );
    } else {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      AccessibilityInfo.announceForAccessibility(
        `Refund processing. Your refund request of ${formatMoney(refundAmount)} is being processed. Reference ${refundRef}.`
      );
    }
  }, [refund, refundAmount, refundRef]);

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

  if (!refund) {
    return (
      <View className="flex-1 bg-surface">
        <TopBar title="Refund Status" />
        <View className="items-center gap-4 p-6 pt-16">
          <View className="h-16 w-16 items-center justify-center rounded-full border-1 border-border bg-surface">
            <Icon name="orders" size="lg" className="text-secondary" />
          </View>
          <View className="items-center gap-2">
            <Text role="heading" className="type-h2 text-center text-primary">
              No Refund Request Found
            </Text>
            <Text className="type-text-secondary text-center text-secondary">
              There is currently no active refund request recorded for Order #{order.order_number}.
            </Text>
          </View>
          <View className="w-full gap-3 pt-6">
            {order.payment_method === 'payhere' &&
            order.payment_status === 'paid' ? (
              <Button
                label="Request a Refund"
                hint="Opens the refund request form for this order"
                onPress={() =>
                  router.replace({
                    pathname: '/orders/[id]/refund' as any,
                    params: { id: order.id },
                  })
                }
              />
            ) : null}
            <Button
              variant="secondary"
              label="View Order Details"
              hint="Navigates to the details for this order"
              onPress={() =>
                router.replace({ pathname: '/orders/[id]' as any, params: { id: order.id } })
              }
            />
            <Button
              variant="secondary"
              label="Back to Orders"
              hint="Navigates to your orders list"
              onPress={() => router.replace('/(tabs)/orders')}
            />
          </View>
        </View>
      </View>
    );
  }

  const status: RefundStatus = refund.status;
  const config = STATUS_CONFIG[status];

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
            message="This refund request was declined. You can contact the seller or submit a new request if needed."
          />
        ) : null}

        {/* Refund Details Card */}
        <View
          accessibilityRole="summary"
          className="gap-3 rounded-12 border-1 border-border bg-surface p-4">
          <Text className="type-mono text-secondary" maxFontSizeMultiplier={2}>
            Order #{order.order_number} · Reference {refundRef}
          </Text>

          <View className="flex-row items-baseline justify-between border-b-1 border-border pb-3">
            <Text className="type-label-lg text-primary" maxFontSizeMultiplier={2}>
              Refund Amount
            </Text>
            <Text className="type-h2 text-primary" maxFontSizeMultiplier={2}>
              {formatMoney(refundAmount)}
            </Text>
          </View>

          <View className="gap-2 pt-1">
            <View className="flex-row items-center justify-between">
              <Text className="type-text-secondary text-secondary" maxFontSizeMultiplier={2}>
                Original Payment Ref
              </Text>
              <Text className="type-mono text-primary" maxFontSizeMultiplier={2}>
                {paymentRef}
              </Text>
            </View>

            <View className="flex-row items-center justify-between">
              <Text className="type-text-secondary text-secondary" maxFontSizeMultiplier={2}>
                Reason
              </Text>
              <Text className="type-text-primary text-primary" maxFontSizeMultiplier={2}>
                {reasonText}
              </Text>
            </View>

            {refund.reasonDetails ? (
              <View className="gap-0.5">
                <Text className="type-text-secondary text-secondary" maxFontSizeMultiplier={2}>
                  Details
                </Text>
                <Text className="type-text-primary text-primary" maxFontSizeMultiplier={2}>
                  {refund.reasonDetails}
                </Text>
              </View>
            ) : null}

            <View className="flex-row items-center justify-between">
              <Text className="type-text-secondary text-secondary" maxFontSizeMultiplier={2}>
                Status
              </Text>
              <Text className="type-label text-primary capitalize" maxFontSizeMultiplier={2}>
                {status === 'requested'
                  ? 'Refund Requested'
                  : status === 'processing'
                    ? 'Processing'
                    : status === 'refunded'
                      ? 'Completed'
                      : 'Declined'}
              </Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View className="gap-3">
          {status === 'failed' ? (
            <Button
              label="Request Refund Again"
              hint="Re-opens the refund request form to retry"
              onPress={() =>
                router.replace({ pathname: '/orders/[id]/refund' as any, params: { id: order.id } })
              }
            />
          ) : null}

          <Button
            label="View Order Details"
            variant="secondary"
            hint="Navigates to the full details for this order"
            onPress={() =>
              router.replace({ pathname: '/orders/[id]' as any, params: { id: order.id } })
            }
          />

          <Button
            label="Back to Orders"
            variant="secondary"
            hint="Navigates back to your complete list of orders"
            onPress={() => router.replace('/(tabs)/orders')}
          />
        </View>
      </ScrollView>
    </View>
  );
}
