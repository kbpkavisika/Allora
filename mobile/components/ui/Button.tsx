import { useState } from 'react';
import { ActivityIndicator, Pressable, Text, View, type PressableProps } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';

export type ButtonVariant = 'primary' | 'secondary' | 'social' | 'link' | 'destructive';
export type ButtonSize = 'lg' | 'md' | 'sm';

export interface ButtonProps
  extends Omit<PressableProps, 'children' | 'style' | 'disabled' | 'onPress' | 'aria-label'> {
  label: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  onPress?: () => void;
  disabled?: boolean;
  loading?: boolean;
  leadingIcon?: React.ReactNode;
  fullWidth?: boolean;
  hint?: string;
  className?: string;
}

const CONTAINER: Record<ButtonVariant, string> = {
  primary: 'bg-primary active:bg-primary-hover',
  secondary: 'bg-surface border-1.5 border-primary active:bg-surface-sunken',
  social: 'bg-surface border-1.5 border-border-strong active:bg-surface-sunken',
  link: 'bg-transparent',
  destructive: 'bg-error',
};

const CONTAINER_INERT: Record<ButtonVariant, string> = {
  primary: 'bg-border',
  secondary: 'bg-surface border-1.5 border-border',
  social: 'bg-surface border-1 border-border',
  link: 'bg-transparent',
  destructive: 'bg-border',
};

const SIZE: Record<ButtonSize, string> = {
  lg: 'min-h-control-lg px-6',
  md: 'min-h-control-md px-6',
  sm: 'min-h-control-sm px-5',
};

const LABEL: Record<ButtonVariant, string> = {
  primary: 'text-surface',
  secondary: 'text-primary',
  social: 'text-primary',
  link: 'text-primary underline',
  destructive: 'text-surface',
};

const LABEL_SIZE: Record<ButtonSize, string> = {
  lg: 'type-label-lg',
  md: 'type-label-lg',
  sm: 'type-label-sm',
};

export function Button({
  label,
  variant = 'primary',
  size = 'lg',
  onPress,
  disabled = false,
  loading = false,
  leadingIcon,
  fullWidth = true,
  hint,
  className = '',
  ...rest
}: Readonly<ButtonProps>) {
  const [focused, setFocused] = useState(false);
  const reduceMotion = useReducedMotion();
  const inert = disabled || loading;

  const labelColor = inert ? 'text-disabled' : LABEL[variant];
  const isLink = variant === 'link';
  const sizing = isLink
    ? 'min-h-tap px-0'
    : variant === 'social' && size === 'lg'
      ? 'min-h-control-field px-6'
      : SIZE[size];
  const width = fullWidth && !isLink ? 'w-full' : 'self-start';
  const isFilled = variant === 'primary' || variant === 'destructive';
  const press = !inert && !reduceMotion && isFilled ? 'active:scale-[0.97]' : '';

  return (
    <Pressable
      onPress={inert ? undefined : onPress}
      disabled={inert}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      role="button"
      aria-label={label}
      aria-disabled={disabled}
      aria-busy={loading}
      accessibilityHint={hint}
      className={`relative flex-row items-center justify-center gap-2 rounded-full ${sizing} ${
        inert ? CONTAINER_INERT[variant] : CONTAINER[variant]
      } ${width} ${press} ${className}`}
      {...rest}>
      {focused && !inert ? (
        <View
          pointerEvents="none"
          aria-hidden
          className="absolute inset-0 rounded-full border-3 border-info"
        />
      ) : null}

      {loading ? (
        <ActivityIndicator size={20} className={labelColor} />
      ) : (
        <>
          {leadingIcon}
          <Text className={`${LABEL_SIZE[size]} ${labelColor}`} maxFontSizeMultiplier={2}>
            {label}
          </Text>
        </>
      )}
    </Pressable>
  );
}
