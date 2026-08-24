import { Pressable, Text, View } from 'react-native';

export type PaymentMethod = 'payhere' | 'other';

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
    ? 'border-primary bg-primary/10'
    : 'border-border-strong bg-surface';

  return (
    <Pressable
      role="radio"
      accessibilityState={{ selected, disabled }}
      accessibilityLabel={title}
      accessibilityHint={description}
      disabled={disabled}
      onPress={() => onPress(method)}
      className={`w-full rounded-3xl border-2 px-5 py-4 ${containerClass} ${disabled ? 'opacity-60' : ''}`}>
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1 gap-1">
          <Text className="type-label-lg text-primary" maxFontSizeMultiplier={2}>
            {title}
          </Text>
          <Text className="type-body-sm text-secondary" maxFontSizeMultiplier={2}>
            {description}
          </Text>
        </View>

        <View
          aria-hidden
          className={`mt-1 h-6 w-6 rounded-full border-2 ${
            selected ? 'border-primary bg-primary' : 'border-border-strong bg-surface'
          }`}
        />
      </View>
    </Pressable>
  );
}
