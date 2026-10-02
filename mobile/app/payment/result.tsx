import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef } from 'react';
import { AccessibilityInfo, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { Callout } from '@/components/ui/Callout';
import { Icon, type IconName } from '@/components/ui/Icon';
import { ReadAloudButton } from '@/components/payment/ReadAloudButton';
import { formatCheckoutResultSpeech } from '@/components/payment/paymentSpeech';
import { formatMoney } from '@/lib/orders';
import { useOrders } from '@/lib/OrdersProvider';

type ResultVariant = 'success' | 'failure' | 'cod' | 'cancelled' | 'pending';

type ResultParams = {
  variant?: string;
  orderId?: string;
  count?: string;
  total?: string;
  reference?: string;
  message?: string;
};

const PRESENTATION: Record<
  ResultVariant,
  {
    icon: IconName;
    ring: string;
    iconColor: string;
    heading: string;
    description: string;
    haptic: () => Promise<void>;
  }
> = {
  success: {
    icon: 'check',
    ring: 'border-success bg-success-tint',
    iconColor: 'text-success',
    heading: 'Payment successful',
    description: 'Your order is confirmed. The payment was successful.',
    haptic: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
  },
  cod: {
    icon: 'orders',
    ring: 'border-success bg-success-tint',
    iconColor: 'text-success',
    heading: 'Order placed!',
    description: 'Your order has been placed. Payment is due upon delivery.',
    haptic: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
  },
  failure: {
    icon: 'close',
    ring: 'border-error bg-error-tint',
    iconColor: 'text-error',
    heading: 'Payment failed',
    description: "The payment wasn't completed, so your order was not placed.",
    haptic: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error),
  },
  cancelled: {
    icon: 'close',
    ring: 'border-border-strong bg-surface-sunken',
    iconColor: 'text-secondary',
    heading: 'Payment cancelled',
    description: 'The payment process was cancelled before completion. No charges were made.',
    haptic: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning),
  },
  pending: {
    icon: 'orders',
    ring: 'border-info bg-info-tint',
    iconColor: 'text-info',
    heading: 'Payment processing',
    description: 'Your payment is being processed. Please wait while verification is finalized.',
    haptic: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium),
  },
};

export default function PaymentResultScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<ResultParams>();
  const { getOrder } = useOrders();
  const hasAnnouncedRef = useRef(false);

  const rawVariant = params.variant ?? 'success';
  const variant: ResultVariant =
    rawVariant === 'failure'
      ? 'failure'
      : rawVariant === 'cod'
        ? 'cod'
        : rawVariant === 'cancelled'
          ? 'cancelled'
          : rawVariant === 'pending'
            ? 'pending'
            : 'success';

  const total = Number(params.total ?? '0');
  const count = Number(params.count ?? '1');
  const order = params.orderId ? getOrder(params.orderId) : undefined;
  const orderNumber = order?.order_number;
  const presentation = PRESENTATION[variant];

  useEffect(() => {
    if (hasAnnouncedRef.current) return;
    hasAnnouncedRef.current = true;

    void presentation.haptic();

    const announcements: Record<ResultVariant, string> = {
      success: `Payment successful. Amount paid: ${formatMoney(total)}. Reference: ${params.reference ?? 'N/A'}.`,
      cod: `Order placed. Total amount: ${formatMoney(total)} due on delivery.`,
      failure: `Payment failed. ${params.message || 'No amount was charged.'}`,
      cancelled: 'Payment cancelled. No charges were made.',
      pending: `Payment is being processed for ${formatMoney(total)}.`,
    };

    AccessibilityInfo.announceForAccessibility(announcements[variant]);
  }, [variant, total, params.reference, params.message, presentation]);

  function trackOrder() {
    if (count > 1 || !params.orderId) {
      router.replace('/(tabs)/orders');
      return;
    }
    router.replace({ pathname: '/orders/[id]', params: { id: params.orderId } });
  }

  return (
    <View className="flex-1 bg-surface">
      <ScrollView
        contentContainerStyle={{
          padding: 16,
          paddingTop: insets.top + 32,
          paddingBottom: insets.bottom + 32,
          gap: 24,
        }}
        showsVerticalScrollIndicator={false}>
        {/* Visual Icon & Status Heading */}
        <View className="items-center gap-4">
          <View
            accessibilityRole="image"
            accessibilityLabel={`${presentation.heading} icon`}
            className={`h-16 w-16 items-center justify-center rounded-full border-1 ${presentation.ring}`}>
            <Icon name={presentation.icon} size="lg" className={presentation.iconColor} />
          </View>
          <View className="items-center gap-2">
            <Text
              role="heading"
              accessibilityRole="header"
              className="type-h1 text-center text-primary"
              maxFontSizeMultiplier={1.5}>
              {presentation.heading}
            </Text>
            <Text className="type-text-lg text-center text-secondary" maxFontSizeMultiplier={2}>
              {presentation.description}
            </Text>
          </View>
        </View>

        {/* Warning / Error / Notice Callouts */}
        {variant === 'failure' ? (
          <Callout
            tone="warning"
            message={
              params.message?.trim() ||
              'No amount was charged. You can try the payment again, or choose a different payment method.'
            }
          />
        ) : null}

        {variant === 'cancelled' ? (
          <Callout
            tone="info"
            message="Your order was not placed and no payment was deducted. You can resume checkout at any time."
          />
        ) : null}

        {variant === 'pending' ? (
          <Callout
            tone="info"
            message="Payment verification is taking a moment. If this does not update automatically, check your order status in a few minutes."
          />
        ) : null}

        {/* Summary Details Card */}
        <View
          accessibilityRole="summary"
          className="gap-3 rounded-12 border-1 border-border bg-surface p-4">
          {count > 1 ? (
            <Text className="type-text-secondary text-secondary" maxFontSizeMultiplier={2}>
              {count} orders placed · one per shop
            </Text>
          ) : orderNumber ? (
            <Text className="type-mono text-secondary" maxFontSizeMultiplier={2}>
              Order #{orderNumber}
            </Text>
          ) : null}

          <View className="flex-row items-baseline justify-between border-b-1 border-border pb-3">
            <Text className="type-label-lg text-primary" maxFontSizeMultiplier={2}>
              {variant === 'cod' ? 'Amount Due' : 'Amount'}
            </Text>
            <Text className="type-h2 text-primary" maxFontSizeMultiplier={2}>
              {formatMoney(total)}
            </Text>
          </View>

          <View className="gap-2 pt-1">
            <View className="flex-row items-center justify-between">
              <Text className="type-text-secondary text-secondary" maxFontSizeMultiplier={2}>
                Payment Method
              </Text>
              <Text className="type-text-primary text-primary" maxFontSizeMultiplier={2}>
                {variant === 'cod' ? 'Cash on Delivery' : 'PayHere (Online)'}
              </Text>
            </View>

            {params.reference ? (
              <View className="flex-row items-center justify-between">
                <Text className="type-text-secondary text-secondary" maxFontSizeMultiplier={2}>
                  Payment Reference
                </Text>
                <Text className="type-mono text-primary" maxFontSizeMultiplier={2}>
                  {params.reference}
                </Text>
              </View>
            ) : null}

            {variant === 'success' ? (
              <View className="pt-1">
                <Text className="type-text-secondary text-secondary" maxFontSizeMultiplier={2}>
                  A confirmation receipt will be sent to your registered email address.
                </Text>
              </View>
            ) : null}
          </View>

          <ReadAloudButton
            text={formatCheckoutResultSpeech({
              variant,
              amount: total,
              currency: 'LKR',
              reference: params.reference,
              message: params.message,
            })}
            label="Read aloud summary"
          />
        </View>

        {/* Actions */}
        {variant === 'failure' || variant === 'cancelled' ? (
          <View className="gap-3">
            <Button
              label="Try again"
              hint="Returns to the checkout screen to re-attempt payment"
              onPress={() => router.replace('/payment/checkout')}
            />
            <Button
              variant="secondary"
              label="Return to Shop"
              hint="Navigates back to the main shopping catalogue"
              onPress={() => router.replace('/(tabs)')}
            />
          </View>
        ) : (
          <View className="gap-3">
            <Button
              label="Track your order"
              hint="Navigates to your order tracking page"
              onPress={trackOrder}
            />
            <Button
              variant="secondary"
              label="Back to Shop"
              hint="Navigates back to the main shopping catalogue"
              onPress={() => router.replace('/(tabs)')}
            />
          </View>
        )}
      </ScrollView>
    </View>
  );
}
