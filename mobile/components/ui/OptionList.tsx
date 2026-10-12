import { Pressable, Text, View } from 'react-native';

import { Icon } from '@/components/ui/Icon';

export interface OptionListProps {
  label: string;
  options: readonly string[];
  value: string;
  onChange: (value: string) => void;
  formatOption?: (option: string) => string;
  className?: string;
}

export function OptionList({
  label,
  options,
  value,
  onChange,
  formatOption = (option) => option,
  className = '',
}: OptionListProps) {
  return (
    <View
      role="radiogroup"
      aria-label={label}
      className={`overflow-hidden rounded-12 border-1 border-border bg-surface ${className}`}>
      {options.map((option, index) => {
        const selected = option === value;

        return (
          <Pressable
            key={option}
            onPress={() => onChange(option)}
            role="radio"
            aria-checked={selected}
            aria-label={formatOption(option)}
            className={`min-h-tap flex-row items-center justify-between gap-3 px-4 active:bg-surface-muted ${
              index < options.length - 1 ? 'border-b-1 border-border' : ''
            }`}>
            <Text className="type-text-primary text-primary" maxFontSizeMultiplier={2}>
              {formatOption(option)}
            </Text>
            {selected ? <Icon name="check" size="md" className="text-accent-pressed" /> : null}
          </Pressable>
        );
      })}
    </View>
  );
}
