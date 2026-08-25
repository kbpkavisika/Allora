import { Pressable } from 'react-native';

import { Icon } from '@/components/ui/Icon';

export interface CheckboxProps {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  disabled?: boolean;
  className?: string;
}

export function Checkbox({
  checked,
  onChange,
  label,
  disabled = false,
  className = '',
}: Readonly<CheckboxProps>) {
  return (
    <Pressable
      onPress={disabled ? undefined : () => onChange(!checked)}
      disabled={disabled}
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      aria-disabled={disabled}
      hitSlop={8}
      className={`h-6 w-6 items-center justify-center rounded-4 ${
        checked ? 'bg-primary' : 'border-1.75 border-primary bg-transparent'
      } ${disabled ? 'opacity-50' : ''} ${className}`}>
      {checked ? <Icon name="check" size="sm" className="text-surface" /> : null}
    </Pressable>
  );
}
