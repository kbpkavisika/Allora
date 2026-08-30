import { Text, View } from 'react-native';

import { initials } from '@/lib/profile';

export interface AvatarProps {
  name: string | null;
  email?: string | null;
  className?: string;
}

export function Avatar({ name, email, className = '' }: AvatarProps) {
  return (
    <View
      aria-hidden
      className={`h-10 w-10 items-center justify-center rounded-full bg-surface-sunken ${className}`}>
      <Text className="type-label-lg text-primary" maxFontSizeMultiplier={1.5}>
        {initials(name, email)}
      </Text>
    </View>
  );
}
