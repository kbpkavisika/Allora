import { View, type ViewProps } from 'react-native';

import { useThemeColor } from '@/hooks/use-theme-color';

export type ThemedViewProps = ViewProps;

export function ThemedView({ style, ...otherProps }: ThemedViewProps) {
  const backgroundColor = useThemeColor({}, 'surface');

  return <View style={[{ backgroundColor }, style]} {...otherProps} />;
}
