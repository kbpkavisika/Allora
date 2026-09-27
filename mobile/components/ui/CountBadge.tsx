import { Text, View } from 'react-native';

export type CountBadgeSize = 'sm' | 'md';

export interface CountBadgeProps {
  count: number;
  size?: CountBadgeSize;
  max?: number;
  className?: string;
}

const SIZE: Record<CountBadgeSize, string> = {
  sm: 'h-4 min-w-[16px]',
  md: 'h-[18px] min-w-[18px]',
};

export function CountBadge({ count, size = 'md', max = 9, className = '' }: CountBadgeProps) {
  if (count <= 0) return null;

  return (
    <View
      aria-hidden
      pointerEvents="none"
      className={`items-center justify-center rounded-full bg-accent px-1 ${SIZE[size]} ${className}`}>
      <Text className="type-count text-surface" maxFontSizeMultiplier={1.3}>
        {count > max ? `${max}+` : count}
      </Text>
    </View>
  );
}
