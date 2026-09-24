import { Pressable, Text, View } from 'react-native';

import { Icon, type IconName } from '@/components/ui/Icon';
import { IconButton } from '@/components/ui/IconButton';

export interface MessageContextLineProps {
  label: string;
  icon: IconName;
  onPress?: () => void;
  onRemove?: () => void;
  className?: string;
}

export function MessageContextLine({
  label,
  icon,
  onPress,
  onRemove,
  className = '',
}: MessageContextLineProps) {
  const body = (
    <View className="flex-row items-center gap-1">
      <Icon name={icon} size="sm" className="text-secondary" />
      <Text className="type-text-secondary shrink text-secondary" numberOfLines={1}>
        {label}
      </Text>
    </View>
  );

  return (
    <View className={`flex-row items-center gap-2 ${className}`}>
      {onPress ? (
        <Pressable
          onPress={onPress}
          role="link"
          aria-label={label}
          hitSlop={8}
          className="shrink rounded-4 active:bg-surface-muted">
          {body}
        </Pressable>
      ) : (
        <View className="shrink">{body}</View>
      )}

      {onRemove ? (
        <IconButton
          diameter={32}
          icon={<Icon name="close" size="sm" className="text-secondary" />}
          label="Remove reference"
          hint="Sends the message without this reference"
          onPress={onRemove}
        />
      ) : null}
    </View>
  );
}
