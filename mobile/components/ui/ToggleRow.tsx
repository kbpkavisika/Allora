import { Text, View } from 'react-native';

import { Toggle } from '@/components/ui/Toggle';

export interface ToggleRowProps {
  title: string;
  description?: string;
  value: boolean;
  onValueChange: (next: boolean) => void;
  disabled?: boolean;
  className?: string;
}

export function ToggleRow({
  title,
  description,
  value,
  onValueChange,
  disabled = false,
  className = '',
}: ToggleRowProps) {
  return (
    <View className={`min-h-control-lg flex-row items-center justify-between gap-4 ${className}`}>
      <View className="flex-1 gap-0.5">
        <Text className="type-label-lg text-primary" maxFontSizeMultiplier={2}>
          {title}
        </Text>
        {description ? (
          <Text className="type-text-secondary text-secondary" maxFontSizeMultiplier={2}>
            {description}
          </Text>
        ) : null}
      </View>

      <Toggle value={value} onValueChange={onValueChange} label={title} disabled={disabled} />
    </View>
  );
}
