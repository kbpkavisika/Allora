import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { KeyboardScreen } from '@/components/ui/KeyboardScreen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { PaymentAuthentication } from './PaymentAuthentication';
import { PaymentConfirmation } from './PaymentConfirmation';
import { PaymentResult } from './PaymentResult';
import type { PaymentGateway } from '@/services/payment/paymentGateway';
import { MockPaymentGateway } from '@/services/payment/mockPaymentGateway';
import type { PaymentRequest, PaymentResult as PaymentResultData, PaymentState } from '@/services/payment/paymentTypes';

export interface PaymentScreenProps {
  request: PaymentRequest;
  gateway?: PaymentGateway;
}

export function PaymentScreen({ request, gateway = new MockPaymentGateway() }: PaymentScreenProps) {
  const [state, setState] = useState<PaymentState>('idle');
  const [result, setResult] = useState<PaymentResultData | null>(null);

  async function handleConfirm() {
    setState('processing');
    setResult(null);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const paymentResult = await gateway.startPayment(request);
    setResult(paymentResult);
    setState(paymentResult.state);
  }

  function handleOtpSubmitted() {
    setState('pending');
    setResult({
      state: 'pending',
      reference: request.orderId,
      message: 'Authentication was submitted for provider verification.',
    });
  }

  return (
    <KeyboardScreen>
      <View className="flex-1 gap-6">
        <ScreenHeader title="Payment" />
        <View accessibilityRole="summary" className="gap-3 rounded-12 border-1 border-border-strong bg-surface p-4">
          <Text accessibilityRole="header" className="type-h2 text-primary" maxFontSizeMultiplier={2}>
            {request.currency} {request.amount.toLocaleString()}
          </Text>
          <Text className="type-text-primary text-secondary" maxFontSizeMultiplier={2}>
            Order reference: {request.orderId}
          </Text>
          {request.description ? (
            <Text className="type-text-primary text-secondary" maxFontSizeMultiplier={2}>
              {request.description}
            </Text>
          ) : null}
          <Text className="type-label text-primary">Payment method: Mock gateway</Text>
        </View>

        {state === 'idle' ? (
          <PaymentConfirmation
            amount={request.amount}
            currency={request.currency}
            onConfirm={handleConfirm}
          />
        ) : null}

        {state === 'processing' ? (
          <View accessibilityRole="alert" accessibilityLiveRegion="polite" className="gap-2 rounded-12 border-1 border-border-strong bg-surface p-4">
            <Text className="type-h3 text-primary" maxFontSizeMultiplier={2}>Processing payment</Text>
            <Text className="type-text-primary text-secondary" maxFontSizeMultiplier={2}>Please wait while the mock payment gateway processes your request.</Text>
          </View>
        ) : null}

        {state === 'authentication_required' ? (
          <PaymentAuthentication onSubmitOtp={handleOtpSubmitted} />
        ) : null}

        {result && state !== 'authentication_required' && state !== 'processing' ? (
          <PaymentResult result={result} />
        ) : null}

        {state !== 'idle' && state !== 'processing' && state !== 'authentication_required' ? (
          <Button
            label="Start another payment"
            variant="secondary"
            onPress={() => {
              setState('idle');
              setResult(null);
            }}
            hint="Clears the current payment result and returns to confirmation"
          />
        ) : null}
      </View>
    </KeyboardScreen>
  );
}
