import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { Icon } from '@/components/ui/Icon';
import { OptionList } from '@/components/ui/OptionList';

export interface SelectProps {
  label: string;
  options: readonly string[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string | null;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

type SelectState = 'rest' | 'open' | 'error' | 'disabled';

const CONTAINER: Record<SelectState, string> = {
  rest: 'rounded-8 border-1 border-border-strong bg-surface',
  open: 'rounded-8 border-1.5 border-primary bg-surface',
  error: 'rounded-8 border-1.5 border-error bg-surface',
  disabled: 'rounded-8 border-1 border-border bg-surface',
};

const LABEL_TONE: Record<SelectState, string> = {
  rest: 'text-primary',
  open: 'text-primary',
  error: 'text-error',
  disabled: 'text-disabled',
};

export function Select({
  label,
  options,
  value,
  onChange,
  placeholder = 'Select an option',
  error,
  required = false,
  disabled = false,
  className = '',
}: SelectProps) {
  const [open, setOpen] = useState(false);

  const hasError = Boolean(error);
  const state: SelectState = disabled ? 'disabled' : hasError ? 'error' : open ? 'open' : 'rest';

  const nameParts = [label];
  if (required) nameParts.push('required');
  if (value) nameParts.push(value);
  if (error) nameParts.push(`error, ${error}`);

  return (
    <View className={className}>
      <View className="mb-1 flex-row items-center gap-2">
        <Text className={`type-label-lg ${LABEL_TONE[state]}`} maxFontSizeMultiplier={2}>
          {label}
        </Text>
        {required ? (
          <Text
            className={`type-text-primary ${disabled ? 'text-disabled' : 'text-secondary'}`}
            maxFontSizeMultiplier={2}>
            Required
          </Text>
        ) : null}
      </View>

      <Pressable
        onPress={disabled ? undefined : () => setOpen((current) => !current)}
        disabled={disabled}
        role="button"
        aria-label={nameParts.join(', ')}
        aria-expanded={open}
        aria-disabled={disabled}
        className={`min-h-control-field flex-row items-center gap-2 px-4 py-2 ${CONTAINER[state]}`}>
        <Text
          className={`type-text-primary flex-1 ${value ? 'text-primary' : 'text-secondary'}`}
          numberOfLines={1}
          maxFontSizeMultiplier={2}>
          {value || placeholder}
        </Text>
        <Icon
          name="forward"
          size="md"
          className="text-secondary"
          style={{ transform: [{ rotate: open ? '-90deg' : '90deg' }] }}
        />
      </Pressable>

      {open && !disabled ? (
        <OptionList
          label={label}
          options={options}
          value={value}
          onChange={(option) => {
            onChange(option);
            setOpen(false);
          }}
          className="mt-1"
        />
      ) : null}

      {hasError ? (
        <Text
          role="alert"
          aria-live="assertive"
          className="type-text-primary mt-1 text-error"
          maxFontSizeMultiplier={2}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}
