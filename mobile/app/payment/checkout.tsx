import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { PaymentMethodOption, type PaymentMethod } from '@/components/payment/PaymentMethodOption';
import { Button } from '@/components/ui/Button';
import { KeyboardScreen } from '@/components/ui/KeyboardScreen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { startPayHereCheckout } from '@/lib/payments/payHere';

const CHECKOUT_TOTAL_LKR = 2500;
const ORDER_ID = 'ORDER-2500-LKR';

export default function CheckoutScreen() {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('payhere');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const handleSelectMethod = async (method: PaymentMethod) => {
    await Haptics.selectionAsync();
    setSelectedMethod(method);
  };

  const handleConfirmPayment = async () => {
    setIsSubmitting(true);
    setStatusMessage(null);

    if (selectedMethod !== 'payhere') {
      setStatusMessage('This checkout currently supports PayHere only.');
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      setIsSubmitting(false);
      return;
    }

    const outcome = await startPayHereCheckout({
      orderId: ORDER_ID,
      amountLkr: CHECKOUT_TOTAL_LKR,
    });

    if (outcome.status === 'success') {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }

    router.push({
      pathname: '/payment/receipt',
      params: {
        status: outcome.status,
        reference: outcome.reference,
        message: outcome.message,
        amountLkr: String(CHECKOUT_TOTAL_LKR),
      },
    });

    setIsSubmitting(false);
  };

  return (
    <KeyboardScreen>
      <View className="flex-1 gap-8">
        <ScreenHeader title="Checkout" />

        <View className="gap-3 rounded-3xl border-2 border-border-strong bg-surface p-6">
          <Text className="type-label-sm uppercase tracking-wide text-secondary">Payment summary</Text>
          <Text className="type-h1 text-primary" maxFontSizeMultiplier={2}>
            LKR {CHECKOUT_TOTAL_LKR.toLocaleString()}
          </Text>
          <Text className="type-body-sm text-secondary" maxFontSizeMultiplier={2}>
            Total amount due for this order.
          </Text>
        </View>

        <View accessibilityRole="radiogroup" className="gap-4">
          <Text className="type-label-lg text-primary" maxFontSizeMultiplier={2}>
            Select payment method
          </Text>

          <PaymentMethodOption
            method="payhere"
            title="PayHere"
            description="Secure card and wallet payments through PayHere gateway"
            selected={selectedMethod === 'payhere'}
            onPress={handleSelectMethod}
          />

          <PaymentMethodOption
            method="other"
            title="Other methods"
            description="Not available in this release"
            selected={selectedMethod === 'other'}
            onPress={handleSelectMethod}
            disabled
          />
        </View>

        {statusMessage ? (
          <View role="alert" className="rounded-2xl border border-warning bg-warning-tint px-4 py-3">
            <Text className="type-body-sm text-primary" maxFontSizeMultiplier={2}>
              {statusMessage}
            </Text>
          </View>
        ) : null}

        <Button
          label="Confirm payment"
          size="lg"
          fullWidth
          loading={isSubmitting}
          onPress={handleConfirmPayment}
          hint="Confirms your selected payment method and opens PayHere"
        />

        <Text className="type-body-sm text-secondary" maxFontSizeMultiplier={2}>
          Confirmation is shown with haptic and on-screen text feedback. No audio-only signals are used.
        </Text>
      </View>
    </KeyboardScreen>
  );
}
