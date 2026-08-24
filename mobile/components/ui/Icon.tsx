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
  | 'account'
  | 'lock'
  | 'shield';
export type IconSize = 'sm' | 'md' | 'lg';
export type BrandName = 'apple' | 'google';

const GLYPH: Record<IconName, React.ComponentProps<typeof Feather>['name']> = {
  back: 'chevron-left',
  forward: 'chevron-right',
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
  account: 'user',
  lock: 'lock',
  shield: 'shield',
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
