import { getTypography, type TypographyToken } from '@/constants/theme';
import { useColorScheme } from '@/hooks/useColorScheme';

export function useTypography(token: TypographyToken) {
  const scheme = useColorScheme();
  return getTypography(token, scheme);
}
