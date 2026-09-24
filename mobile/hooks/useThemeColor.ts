/**
 * Learn more about light and dark modes:
 * https://docs.expo.dev/guides/color-schemes/
 */

import { Colors, resolveColor } from '@/constants/theme';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useProfile } from '@/hooks/useProfile';

export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: keyof typeof Colors.light & keyof typeof Colors.dark
) {
  const theme = useColorScheme() ?? 'light';
  const { profile } = useProfile();
  const colorFromProps = props[theme];

  if (colorFromProps) {
    return colorFromProps;
  } else {
    return resolveColor(colorName, theme, !!profile?.high_contrast);
  }
}
