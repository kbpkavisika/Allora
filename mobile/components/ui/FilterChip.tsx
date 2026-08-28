import { Pressable, Text } from 'react-native';

import { Icon, type IconName } from '@/components/ui/Icon';

type ChipState = 'rest' | 'selected' | 'disabled';

const CONTAINER: Record<ChipState, string> = {
  rest: 'border-1 border-border-strong bg-surface',
  selected: 'border-1.5 border-primary bg-surface-sunken',
  disabled: 'border-1 border-border bg-surface',
};

const LABEL: Record<ChipState, string> = {
  rest: 'type-text-primary text-primary',
  selected: 'type-label-lg text-primary',
  disabled: 'type-text-primary text-disabled',
};

const GLYPH: Record<ChipState, string> = {
  rest: 'text-primary',
  selected: 'text-primary',
  disabled: 'text-disabled',
};

function chipState(selected: boolean, disabled: boolean): ChipState {
  if (disabled) return 'disabled';
  return selected ? 'selected' : 'rest';
}

export interface FilterChipProps {
  label: string;
  selected?: boolean;
  disabled?: boolean;
  showChevron?: boolean;
  onPress: () => void;
  className?: string;
}

export function FilterChip({
  label,
  selected = false,
  disabled = false,
  showChevron = false,
  onPress,
  className = '',
}: FilterChipProps) {
  const state = chipState(selected, disabled);

  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      disabled={disabled}
      role="button"
      aria-label={label}
      aria-selected={selected}
      aria-disabled={disabled}
      className={`min-h-control-md flex-row items-center justify-center gap-2 rounded-8 px-4 ${CONTAINER[state]} ${className}`}>
      <Text className={LABEL[state]} numberOfLines={1} maxFontSizeMultiplier={1.5}>
        {label}
      </Text>

      {showChevron ? <Icon name="chevron" size="md" className={GLYPH[state]} /> : null}
    </Pressable>
  );
}

export interface IconFilterChipProps {
  icon: IconName;
  label: string;
  selected?: boolean;
  disabled?: boolean;
  onPress: () => void;
  className?: string;
}

export function IconFilterChip({
  icon,
  label,
  selected = false,
  disabled = false,
  onPress,
  className = '',
}: IconFilterChipProps) {
  const state = chipState(selected, disabled);

  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      disabled={disabled}
      role="button"
      aria-label={label}
      aria-selected={selected}
      aria-disabled={disabled}
      className={`min-h-control-md w-tap items-center justify-center rounded-8 ${CONTAINER[state]} ${className}`}>
      <Icon name={icon} size="md" className={GLYPH[state]} />
    </Pressable>
  );
}
