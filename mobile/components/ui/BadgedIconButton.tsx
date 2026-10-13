import { View } from 'react-native';

import { CountBadge } from '@/components/ui/CountBadge';
import { Icon, type IconName } from '@/components/ui/Icon';
import { IconButton } from '@/components/ui/IconButton';

export interface BadgedIconButtonProps {
  icon: IconName;
  count: number;
  label: string;
  hint?: string;
  onPress: () => void;
}

export function BadgedIconButton({ icon, count, label, hint, onPress }: BadgedIconButtonProps) {
  return (
    <View>
      <IconButton
        icon={<Icon name={icon} size="lg" className="text-primary" />}
        label={label}
        hint={hint}
        onPress={onPress}
      />
      <CountBadge count={count} size="sm" className="absolute right-0 top-0" />
    </View>
  );
}
