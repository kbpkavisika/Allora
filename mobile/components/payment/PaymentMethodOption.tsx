import { Pressable, Text, View } from 'react-native';

import type { PaymentMethod } from '@/lib/orders';

export type { PaymentMethod } from '@/lib/orders';

export interface PaymentMethodOptionProps {
  method: PaymentMethod;
  title: string;
  description: string;
  selected: boolean;
  disabled?: boolean;
  onPress: (method: PaymentMethod) => void;
}

export function PaymentMethodOption({
  method,
  title,
  description,
  selected,
  disabled = false,
  onPress,
}: PaymentMethodOptionProps) {
  const containerClass = selected
    ? 'border-primary bg-surface-sunken'
    : 'border-border-strong bg-surface';

  return (
    <Pressable
      role="radio"
      accessibilityState={{ selected, disabled }}
      accessibilityLabel={title}
      accessibilityHint={description}
      disabled={disabled}
      onPress={() => onPress(method)}
      className={`w-full rounded-12 border-1.5 px-5 py-4 ${containerClass}`}>
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1 gap-1">
          <Text className="type-label-lg text-primary" maxFontSizeMultiplier={2}>
            {title}
          </Text>
          <Text className="type-text-secondary text-secondary" maxFontSizeMultiplier={2}>
            {description}
          </Text>
        </View>

        <View
          aria-hidden
          className={`mt-1 h-6 w-6 items-center justify-center rounded-full border-1.5 ${
            selected ? 'border-primary' : 'border-border-strong'
          }`}>
          {selected ? <View className="h-3 w-3 rounded-full bg-primary" /> : null}
        </View>
      </View>
    </Pressable>
  );
}
