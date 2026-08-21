import { Pressable } from 'react-native';

export interface IconButtonProps {
  icon: React.ReactNode;
  label: string;
  hint?: string;
  onPress?: () => void;
  diameter?: 44 | 32;
  variant?: 'bare' | 'outlined';
  disabled?: boolean;
  className?: string;
}

const DIAMETER: Record<44 | 32, string> = { 44: 'h-tap w-tap', 32: 'h-glyph w-glyph' };

export function IconButton({
  icon,
  label,
  hint,
  onPress,
  diameter = 44,
  variant = 'bare',
  disabled = false,
  className = '',
}: IconButtonProps) {
  const surface =
    variant === 'outlined' ? 'border-1 border-border-strong bg-surface' : 'bg-transparent';

  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      disabled={disabled}
      role="button"
      aria-label={label}
      aria-disabled={disabled}
      accessibilityHint={hint}
      hitSlop={diameter === 32 ? 6 : undefined}
      className={`items-center justify-center rounded-full ${DIAMETER[diameter]} ${surface} ${
        disabled ? '' : 'active:bg-surface-sunken'
      } ${className}`}>
      {icon}
    </Pressable>
  );
}
