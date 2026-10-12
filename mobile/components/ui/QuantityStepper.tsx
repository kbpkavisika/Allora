import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();

  return (
    <View className="flex-row items-center gap-3">
      <IconButton
        variant="outlined"
        diameter={44}
        icon={<Icon name="minus" size="md" className="text-primary" />}
        label={t('quantity.decrease', { name: productName })}
        hint={t('quantity.current', { quantity })}
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
        label={t('quantity.increase', { name: productName })}
        hint={t('quantity.current', { quantity })}
        onPress={() => onChange(quantity + 1)}
      />
    </View>
  );
}
