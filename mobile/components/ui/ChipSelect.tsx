import { Pressable, Text, View } from 'react-native';

export interface ChipSelectProps {
  label: string;
  options: readonly string[];
  value: string;
  onChange: (value: string) => void;
  error?: string | null;
  required?: boolean;
  className?: string;
}

export function ChipSelect({
  label,
  options,
  value,
  onChange,
  error,
  required = false,
  className = '',
}: ChipSelectProps) {
  const hasError = Boolean(error);

  return (
    <View className={className}>
      <View className="mb-1 flex-row items-center gap-2">
        <Text className={`type-label-lg ${hasError ? 'text-error' : 'text-primary'}`}>
          {label}
        </Text>
        {required ? <Text className="type-text-primary text-secondary">Required</Text> : null}
      </View>

      <View className="flex-row flex-wrap gap-2" role="radiogroup" aria-label={label}>
        {options.map((option) => {
          const selected = option === value;

          return (
            <Pressable
              key={option}
              onPress={() => onChange(option)}
              role="radio"
              aria-checked={selected}
              aria-label={option}
              className={`min-h-control-md items-center justify-center rounded-8 px-4 ${
                selected
                  ? 'border-1.5 border-primary bg-surface-sunken'
                  : 'border-1 border-border-strong bg-surface'
              }`}>
              <Text className={`type-label ${selected ? 'text-primary' : 'text-secondary'}`}>
                {option}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {hasError ? (
        <Text role="alert" aria-live="assertive" className="type-text-primary mt-1 text-error">
          {error}
        </Text>
      ) : null}
    </View>
  );
}
