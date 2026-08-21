import { Text, View } from 'react-native';

export interface DividerProps {
  label?: string;
  className?: string;
}

export function Divider({ label, className = '' }: DividerProps) {
  return (
    <View className={`flex-row items-center gap-3 ${className}`} role="separator">
      <View className="h-px flex-1 bg-border" aria-hidden />
      {label ? <Text className="type-overline text-secondary">{label}</Text> : null}
      <View className="h-px flex-1 bg-border" aria-hidden />
    </View>
  );
}
