import * as Haptics from 'expo-haptics';
import { useEffect, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';

export interface PaymentAuthenticationProps {
  countdownSeconds?: number;
  onSubmitOtp?: (otp: string) => void;
  onResend?: () => void;
  onRequestMoreTime?: () => void;
}

export function PaymentAuthentication({
  countdownSeconds = 120,
  onSubmitOtp,
  onResend,
  onRequestMoreTime,
}: PaymentAuthenticationProps) {
  const [otp, setOtp] = useState('');
  const [secondsRemaining, setSecondsRemaining] = useState(countdownSeconds);

  useEffect(() => {
    if (secondsRemaining <= 0) return;
    const timer = setInterval(() => setSecondsRemaining((current) => Math.max(0, current - 1)), 1000);
    return () => clearInterval(timer);
  }, [secondsRemaining]);

  function handleChange(value: string) {
    const nextValue = value.replace(/\D/g, '').slice(0, 6);
    setOtp(nextValue);
    if (nextValue.length === 6) onSubmitOtp?.(nextValue);
  }

  async function handleResend() {
    await Haptics.selectionAsync();
    setOtp('');
    setSecondsRemaining(countdownSeconds);
    onResend?.();
  }

  async function handleRequestMoreTime() {
    await Haptics.selectionAsync();
    onRequestMoreTime?.();
  }

  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = String(secondsRemaining % 60).padStart(2, '0');

  return (
    <View
      accessible
      accessibilityLabel="Payment authentication"
      className="gap-5 rounded-12 border-1 border-border-strong bg-surface p-4">
      <View className="gap-2">
        <Text accessibilityRole="header" className="type-h2 text-primary" maxFontSizeMultiplier={2}>
          Verify your payment
        </Text>
        <Text className="type-text-primary text-secondary" maxFontSizeMultiplier={2}>
          Enter the six-digit code provided by your payment provider. This screen does not read or store messages.
        </Text>
      </View>

      <TextInput
        accessibilityLabel="Six-digit payment authentication code"
        accessibilityHint="Enter the six-digit code manually"
        accessibilityRole="text"
        autoComplete="one-time-code"
        keyboardType="number-pad"
        maxLength={6}
        onChangeText={handleChange}
        value={otp}
        className="min-h-control-lg rounded-8 border-1.5 border-border-strong bg-surface px-4 text-center type-h2 text-primary"
      />

      <Text accessibilityLiveRegion="polite" className="type-text-primary text-secondary" maxFontSizeMultiplier={2}>
        Code expires in {minutes}:{seconds}.
      </Text>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Resend payment authentication code"
        accessibilityHint="Requests a new code from the payment provider"
        onPress={handleResend}
        className="min-h-tap justify-center">
        <Text className="type-label text-primary">Resend code</Text>
      </Pressable>

      <Text className="type-text-secondary text-secondary" maxFontSizeMultiplier={2}>
        Didn&apos;t receive the code?
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Request more time for payment authentication"
        accessibilityHint="Requests a new authentication code if the provider supports it"
        onPress={handleRequestMoreTime}
        className="min-h-tap justify-center">
        <Text className="type-label text-primary">Need more time?</Text>
      </Pressable>
    </View>
  );
}
