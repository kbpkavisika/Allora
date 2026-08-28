import * as Haptics from 'expo-haptics';
import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Pressable, Text, TextInput, View } from 'react-native';

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
  const [otp, setOtp] = useState<string[]>(['', '', '', '', '', '']);
  const [secondsRemaining, setSecondsRemaining] = useState(countdownSeconds);
  const inputRefs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    if (secondsRemaining <= 0) return;
    const timer = setInterval(() => setSecondsRemaining((current) => Math.max(0, current - 1)), 1000);
    return () => clearInterval(timer);
  }, [secondsRemaining]);

  function handleChange(index: number, value: string) {
    const digits = value.replace(/\D/g, '');
    const nextDigits = [...otp];

    if (!digits) {
      nextDigits[index] = '';
    } else {
      digits.slice(0, 6 - index).split('').forEach((digit, offset) => {
        nextDigits[index + offset] = digit;
      });
    }

    setOtp(nextDigits);

    if (nextDigits.every(Boolean)) {
      onSubmitOtp?.(nextDigits.join(''));
      return;
    }

    if (digits && index < 5) inputRefs.current[Math.min(index + digits.length, 5)]?.focus();
  }

  async function handleResend() {
    await Haptics.selectionAsync();
    setOtp(['', '', '', '', '', '']);
    setSecondsRemaining(countdownSeconds);
    onResend?.();
    AccessibilityInfo.announceForAccessibility(
      'Resend requested. Enter the new six-digit code when it is available.'
    );
  }

  async function handleRequestMoreTime() {
    await Haptics.selectionAsync();
    onRequestMoreTime?.();
    AccessibilityInfo.announceForAccessibility(
      'More time requested. A new code can be provided by the payment provider if supported.'
    );
  }

  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = String(secondsRemaining % 60).padStart(2, '0');
  const countdownLabel = `Verification code expires in ${minutes} minute${minutes === 1 ? '' : 's'} ${
    Number(seconds) === 1 ? 'second' : 'seconds'
  }.`;

  return (
    <View
      className="gap-5 rounded-12 border-1 border-border-strong bg-surface p-4">
      <View className="gap-2">
        <Text accessibilityRole="header" className="type-h2 text-primary" maxFontSizeMultiplier={2}>
          Verify your payment
        </Text>
        <Text className="type-text-primary text-secondary" maxFontSizeMultiplier={2}>
          Enter the six-digit code provided by your payment provider. This screen does not read or store messages.
        </Text>
      </View>

      <View accessibilityRole="group" accessibilityLabel="Six-digit payment authentication code" className="flex-row gap-2">
        {Array.from({ length: 6 }, (_, index) => {
          const digit = otp[index];
          return (
            <TextInput
              key={index}
              ref={(input) => {
                inputRefs.current[index] = input;
              }}
              accessibilityLabel={`Digit ${index + 1} of 6, ${digit || 'empty'}`}
              accessibilityHint={`Enter digit ${index + 1} of 6 for payment authentication`}
              accessibilityRole="text"
              autoComplete={index === 0 ? 'one-time-code' : 'off'}
              keyboardType="number-pad"
              maxLength={1}
              onChangeText={(value) => handleChange(index, value)}
              onKeyPress={({ nativeEvent }) => {
                if (nativeEvent.key === 'Backspace' && !digit && index > 0) {
                  inputRefs.current[index - 1]?.focus();
                }
              }}
              value={digit}
              className="min-h-control-lg flex-1 rounded-8 border-1.5 border-border-strong bg-surface px-1 text-center type-h2 text-primary"
            />
          );
        })}
      </View>

      <Text accessibilityLabel={countdownLabel} className="type-text-primary text-secondary" maxFontSizeMultiplier={2}>
        Code expires in {minutes}:{seconds}.
      </Text>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Resend payment authentication code"
        accessibilityHint="Requests a new code and resets the countdown"
        accessibilityState={{ disabled: false }}
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
