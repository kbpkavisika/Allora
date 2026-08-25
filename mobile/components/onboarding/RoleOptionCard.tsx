import { Pressable, Text, View } from 'react-native';

import { Icon, type IconName } from '@/components/ui/Icon';

export interface RoleOptionCardProps {
  icon: IconName;
  title: string;
  description: string;
  selected: boolean;
  onPress: () => void;
}

export function RoleOptionCard({
  icon,
  title,
  description,
  selected,
  onPress,
}: RoleOptionCardProps) {
  return (
    <Pressable
      onPress={onPress}
      role="radio"
      aria-checked={selected}
      aria-label={title}
      accessibilityHint={description}
      className={`relative gap-3 rounded-12 bg-surface-muted p-4 ${
        selected ? 'border-1.5 border-primary' : 'border-1.5 border-transparent'
      }`}>
      {selected ? (
        <View
          aria-hidden
          className="absolute right-3 top-3 h-6 w-6 items-center justify-center rounded-full bg-primary">
          <Icon name="check" size="sm" className="text-surface" />
        </View>
      ) : null}

      <View className="h-[48px] w-[48px] items-center justify-center rounded-12 bg-surface">
        <Icon name={icon} size="lg" className="text-primary" />
      </View>

      <View className="gap-1">
        <Text className="type-h3 text-primary">{title}</Text>
        <Text className="type-text-secondary text-secondary">{description}</Text>
      </View>
    </Pressable>
  );
}
