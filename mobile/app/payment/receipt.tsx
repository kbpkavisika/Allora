import { router, useLocalSearchParams } from 'expo-router';
import { Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { KeyboardScreen } from '@/components/ui/KeyboardScreen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';

type ReceiptParams = {
  status?: string;
  reference?: string;
  message?: string;
  amountLkr?: string;
};

export default function ReceiptScreen() {
  const params = useLocalSearchParams<ReceiptParams>();

  const status = params.status === 'failure' ? 'failure' : 'success';
  const reference = params.reference ?? 'N/A';
  const amountLkr = Number(params.amountLkr ?? '0');
  const message =
    params.message ??
    (status === 'success'
      ? 'Your payment is confirmed. A receipt has been issued.'
      : 'Payment failed. Please retry the checkout process.');

  const statusClass =
    status === 'success'
      ? 'border-success bg-success-tint text-primary'
      : 'border-error bg-error-tint text-primary';

  return (
    <KeyboardScreen>
      <View className="flex-1 gap-8">
        <ScreenHeader title="Receipt" />

        <View role="alert" className={`rounded-3xl border-2 px-5 py-4 ${statusClass}`}>
          <Text className="type-label-lg" maxFontSizeMultiplier={2}>
            {status === 'success' ? 'Payment successful' : 'Payment failed'}
          </Text>
          <Text className="mt-2 type-body-sm" maxFontSizeMultiplier={2}>
            {message}
          </Text>
        </View>

        <View className="gap-2 rounded-3xl border-2 border-border-strong bg-surface p-6">
          <Text className="type-label-sm text-secondary" maxFontSizeMultiplier={2}>
            Amount paid
          </Text>
          <Text className="type-h2 text-primary" maxFontSizeMultiplier={2}>
            LKR {amountLkr.toLocaleString()}
          </Text>
          <Text className="type-body-sm text-secondary" maxFontSizeMultiplier={2}>
            Reference: {reference}
          </Text>
        </View>

        <Button
          label="Back to checkout"
          variant="secondary"
          onPress={() => router.replace('/payment/checkout')}
          hint="Returns to the checkout screen"
        />
      </View>
    </KeyboardScreen>
  );
}
