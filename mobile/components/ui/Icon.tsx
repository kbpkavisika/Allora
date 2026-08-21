import Feather from '@expo/vector-icons/Feather';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import { cssInterop } from 'nativewind';

// Icon fonts are not registered interop components, so className needs wiring up explicitly.
cssInterop(Feather, { className: { target: 'style', nativeStyleToProp: { color: true } } });
cssInterop(FontAwesome6, { className: { target: 'style', nativeStyleToProp: { color: true } } });

export type IconName = 'back' | 'dictate' | 'show' | 'hide';
export type IconSize = 'sm' | 'md' | 'lg';
export type BrandName = 'apple' | 'google';

const GLYPH: Record<IconName, React.ComponentProps<typeof Feather>['name']> = {
  back: 'chevron-left',
  dictate: 'mic',
  show: 'eye',
  hide: 'eye-off',
};

const PX: Record<IconSize, number> = { sm: 16, md: 20, lg: 24 };

export interface IconProps {
  name: IconName;
  size?: IconSize;
  className?: string;
}

export function Icon({ name, size = 'lg', className }: IconProps) {
  return (
    <Feather
      name={GLYPH[name]}
      size={PX[size]}
      className={className}
      aria-hidden
      importantForAccessibility="no-hide-descendants"
    />
  );
}

export interface BrandMarkProps {
  name: BrandName;
  size?: IconSize;
  className?: string;
}

/**
 * Provider brand mark.
 *
 * TODO(branding): swap for Apple's official mark (required by their Human Interface Guidelines)
 * and Google's four-colour "G" before shipping real sign-in. Both need react-native-svg.
 */
export function BrandMark({ name, size = 'md', className }: BrandMarkProps) {
  return (
    <FontAwesome6
      name={name}
      brand
      size={PX[size]}
      className={className}
      aria-hidden
      importantForAccessibility="no-hide-descendants"
    />
  );
}
