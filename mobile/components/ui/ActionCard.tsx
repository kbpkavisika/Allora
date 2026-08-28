import { Pressable, Text, View } from 'react-native';

import { Icon, type IconName } from '@/components/ui/Icon';

export interface ActionCardProps {
  icon: IconName;
  title: string;
  caption?: string;
  onPress: () => void;
  className?: string;
}

export function ActionCard({ icon, title, caption, onPress, className = '' }: ActionCardProps) {
  return (
    <Pressable
      onPress={onPress}
      role="button"
      aria-label={caption ? `${title}, ${caption}` : title}
      className={`min-h-[112px] justify-between gap-4 rounded-12 border-1 border-border bg-surface p-5 active:bg-surface-muted ${className}`}>
      <Icon name={icon} size="lg" className="text-primary" />

      <View className="gap-0.5">
        <Text className="type-label-lg text-primary" numberOfLines={1} maxFontSizeMultiplier={1.5}>
          {title}
        </Text>
        {caption ? (
          <Text
            className="type-text-secondary text-secondary"
            numberOfLines={1}
            maxFontSizeMultiplier={1.5}>
            {caption}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}
