import { Text, View } from 'react-native';

export interface SectionHeaderProps {
  title: string;
  action?: React.ReactNode;
}

export function SectionHeader({ title, action }: SectionHeaderProps) {
  return (
    <View className="min-h-tap flex-row items-center justify-between gap-3">
      <Text
        role="heading"
        className="type-h2 flex-1 text-primary"
        numberOfLines={1}
        maxFontSizeMultiplier={1.5}>
        {title}
      </Text>
      {action}
    </View>
  );
}
