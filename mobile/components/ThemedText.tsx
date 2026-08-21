import { Text, type TextProps } from 'react-native';

import type { TypographyToken } from '@/constants/theme';
import { useTypography } from '@/hooks/useTypography';

export type ThemedTextProps = TextProps & {
  type?: TypographyToken;
};

export function ThemedText({ style, type = 'text-primary', ...rest }: ThemedTextProps) {
  const typographyStyle = useTypography(type);

  return <Text style={[typographyStyle, style]} {...rest} />;
}
