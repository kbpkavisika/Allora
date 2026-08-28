import { Pressable, Text, View } from 'react-native';

import { Icon, type IconName } from '@/components/ui/Icon';

export type ListRowValueVariant = 'text' | 'mono';

export interface ListRowProps {
  label?: string;
  value?: string;
  valueVariant?: ListRowValueVariant;
  icon?: IconName;
  title?: string;
  subtitle?: string;
  trailing?: React.ReactNode;
  showChevron?: boolean;
  onPress?: () => void;
  hint?: string;
  className?: string;
}

const VALUE_TYPE: Record<ListRowValueVariant, string> = {
  text: 'type-text-primary',
  mono: 'type-mono',
};

export function ListRow({
  label,
  value,
  valueVariant = 'text',
  icon,
  title,
  subtitle,
  trailing,
  showChevron = false,
  onPress,
  hint,
  className = '',
}: ListRowProps) {
  const accessibleLabel = title ?? label ?? '';
  const chevron = showChevron ? <Icon name="forward" size="md" className="text-secondary" /> : null;
  const valueColumnSpacer =
    !trailing && !showChevron ? <View className="w-5" aria-hidden /> : null;

  const body = (
    <View className={`min-h-control-lg flex-row items-center gap-3 py-3 ${className}`}>
      {icon ? <Icon name={icon} size="lg" className="text-secondary" /> : null}

      <View className="flex-1 flex-row items-center justify-between gap-3">
        {title ? (
          <View className="flex-1 gap-1">
            <Text className="type-label-lg text-primary" numberOfLines={1}>
              {title}
            </Text>
            {subtitle ? (
              <Text className="type-text-secondary text-secondary" numberOfLines={2}>
                {subtitle}
              </Text>
            ) : null}
          </View>
        ) : (
          <>
            <Text className="type-label-lg shrink-0 text-secondary">{label}</Text>
            {value ? (
              <Text
                className={`${VALUE_TYPE[valueVariant]} flex-1 text-right text-primary`}
                numberOfLines={1}>
                {value}
              </Text>
            ) : null}
          </>
        )}
      </View>

      {trailing}
      {chevron}
      {valueColumnSpacer}
    </View>
  );

  if (!onPress) {
    return body;
  }

  return (
    <Pressable
      onPress={onPress}
      role="button"
      aria-label={accessibleLabel}
      accessibilityHint={hint}
      className="active:bg-surface-muted">
      {body}
    </Pressable>
  );
}
