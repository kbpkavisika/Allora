import { Text, View } from 'react-native';

export type BadgeVariant = 'dark' | 'success' | 'warning' | 'neutral';

export interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  className?: string;
}

const CONTAINER: Record<BadgeVariant, string> = {
  dark: 'bg-primary',
  success: 'border-1 border-success bg-success-tint',
  warning: 'border-1 border-warning bg-warning-tint',
  neutral: 'bg-surface-sunken',
};

const LABEL: Record<BadgeVariant, string> = {
  dark: 'text-surface',
  success: 'text-success',
  warning: 'text-warning',
  neutral: 'text-secondary',
};

export function Badge({ label, variant = 'neutral', className = '' }: BadgeProps) {
  return (
    <View
      className={`h-6 items-center justify-center self-start rounded-4 px-2 ${CONTAINER[variant]} ${className}`}>
      <Text className={`type-overline ${LABEL[variant]}`} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}
