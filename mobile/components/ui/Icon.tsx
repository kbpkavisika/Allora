import Feather from '@expo/vector-icons/Feather';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import { cssInterop } from 'nativewind';
import type { StyleProp, TextStyle } from 'react-native';

// Icon fonts are not registered interop components, so className needs wiring up explicitly.
cssInterop(Feather, { className: { target: 'style', nativeStyleToProp: { color: true } } });
cssInterop(FontAwesome6, { className: { target: 'style', nativeStyleToProp: { color: true } } });

export type IconName =
  | 'back'
  | 'forward'
  | 'chevron'
  | 'filters'
  | 'dictate'
  | 'search'
  | 'show'
  | 'hide'
  | 'cart'
  | 'plus'
  | 'minus'
  | 'trash'
  | 'shop'
  | 'save'
  | 'orders'
  | 'payment'
  | 'account'
  | 'lock'
  | 'shield'
  | 'check'
  | 'chat'
  | 'stop'
  | 'star'
  | 'close';
export type IconSize = 'sm' | 'md' | 'lg';
export type BrandName = 'apple' | 'google';
export type SolidIconName = 'star';

const GLYPH: Record<IconName, React.ComponentProps<typeof Feather>['name']> = {
  back: 'chevron-left',
  forward: 'chevron-right',
  chevron: 'chevron-down',
  filters: 'sliders',
  dictate: 'mic',
  search: 'search',
  show: 'eye',
  hide: 'eye-off',
  cart: 'shopping-cart',
  plus: 'plus',
  minus: 'minus',
  trash: 'trash-2',
  shop: 'shopping-bag',
  save: 'heart',
  orders: 'package',
  payment: 'credit-card',
  account: 'user',
  lock: 'lock',
  shield: 'shield',
  check: 'check',
  chat: 'message-circle',
  stop: 'square',
  star: 'star',
  close: 'x',
};

const SOLID_GLYPH: Record<SolidIconName, React.ComponentProps<typeof FontAwesome6>['name']> = {
  star: 'star',
};

const PX: Record<IconSize, number> = { sm: 16, md: 20, lg: 24 };

export interface IconProps {
  name: IconName;
  size?: IconSize;
  className?: string;
  style?: StyleProp<TextStyle>;
}

export function Icon({ name, size = 'lg', className, style }: IconProps) {
  return (
    <Feather
      name={GLYPH[name]}
      size={PX[size]}
      className={className}
      style={style}
      aria-hidden
      importantForAccessibility="no-hide-descendants"
    />
  );
}

export interface SolidIconProps {
  name: SolidIconName;
  size?: IconSize;
  className?: string;
  style?: StyleProp<TextStyle>;
}

// Feather draws outlines only, so filled glyphs come from FontAwesome6's solid set.
export function SolidIcon({ name, size = 'lg', className, style }: SolidIconProps) {
  return (
    <FontAwesome6
      name={SOLID_GLYPH[name]}
      solid
      size={PX[size]}
      className={className}
      style={style}
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
