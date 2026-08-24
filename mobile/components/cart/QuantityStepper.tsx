import { Text, View } from 'react-native';

import { Icon } from '@/components/ui/Icon';
import { IconButton } from '@/components/ui/IconButton';

export interface QuantityStepperProps {
  quantity: number;
  productName: string;
  onChange: (quantity: number) => void;
  min?: number;
}

// Standalone ± control, deliberately kept away from destructive actions (design.md §08,
// wireframe S11 note: "Remove is a labelled button... far from ±" avoids wrong-item removal).
export function QuantityStepper({ quantity, productName, onChange, min = 1 }: QuantityStepperProps) {
  return (
    <View className="flex-row items-center gap-3">
      <IconButton
        variant="outlined"
        diameter={44}
        icon={<Icon name="minus" size="md" className="text-primary" />}
        label={`Decrease quantity of ${productName}`}
        hint={`Currently ${quantity}`}
        onPress={() => onChange(quantity - 1)}
        disabled={quantity <= min}
      />
      <Text className="type-h3 w-8 text-center text-primary" maxFontSizeMultiplier={2}>
        {quantity}
      </Text>
      <IconButton
        variant="outlined"
        diameter={44}
        icon={<Icon name="plus" size="md" className="text-primary" />}
        label={`Increase quantity of ${productName}`}
        hint={`Currently ${quantity}`}
        onPress={() => onChange(quantity + 1)}
      />
    </View>
  );
}
