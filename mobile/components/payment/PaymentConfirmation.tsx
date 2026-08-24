import * as Haptics from 'expo-haptics';
import { Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';

export interface PaymentConfirmationProps {
  amount: number;
  currency: string;
  onConfirm: () => void;
  disabled?: boolean;
}

export function PaymentConfirmation({
  amount,
  currency,
  onConfirm,
  disabled = false,
}: PaymentConfirmationProps) {
  const formattedAmount = amount.toLocaleString();

  async function handleConfirm() {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onConfirm();
  }

  return (
    <View accessibilityRole="summary" className="gap-4 rounded-12 border-1 border-border-strong bg-surface p-4">
      <Text className="type-h3 text-primary" accessibilityRole="header" maxFontSizeMultiplier={2}>
        You are about to pay {currency} {formattedAmount}.
      </Text>
      <Button
        label="Confirm payment"
        onPress={handleConfirm}
        disabled={disabled}
        loading={disabled}
        hint={`Confirms payment of ${currency} ${formattedAmount}`}
      />
    </View>
  );
}
