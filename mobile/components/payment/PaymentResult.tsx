import * as Haptics from 'expo-haptics';
import { useEffect } from 'react';
import { Text, View } from 'react-native';

import type { PaymentResult as PaymentResultData } from '@/services/payment/paymentTypes';

export interface PaymentResultProps {
  result: PaymentResultData;
}

const TITLES: Record<PaymentResultData['state'], string> = {
  authentication_required: 'Payment authentication required.',
  success: 'Payment successful.',
  failed: 'Payment failed.',
  cancelled: 'Payment was cancelled.',
  pending: 'Payment is still being processed.',
} as const;

export function PaymentResult({ result }: PaymentResultProps) {
  useEffect(() => {
    Haptics.notificationAsync(
      result.state === 'success'
        ? Haptics.NotificationFeedbackType.Success
        : result.state === 'pending'
          ? Haptics.NotificationFeedbackType.Warning
          : Haptics.NotificationFeedbackType.Error
    );
  }, [result.state]);

  return (
    <View accessibilityRole="alert" accessibilityLiveRegion="assertive" className="gap-2 rounded-12 border-1 border-border-strong bg-surface p-4">
      <Text accessibilityRole="header" className="type-h3 text-primary" maxFontSizeMultiplier={2}>
        {TITLES[result.state]}
      </Text>
      <Text className="type-text-primary text-secondary" maxFontSizeMultiplier={2}>
        {result.message}
      </Text>
      <Text className="type-text-secondary text-secondary" maxFontSizeMultiplier={2}>
        Reference: {result.reference}
      </Text>
    </View>
  );
}
