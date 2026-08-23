import { View } from 'react-native';

export interface FocusRingProps {
  focused: boolean;
  className?: string;
  children: React.ReactNode;
}

// Spread-only, no offset, so the ring sits flush against the control's own border instead of
// doubling it. Always reserved and only recoloured, so focus never shifts layout.
export function FocusRing({ focused, className = '', children }: FocusRingProps) {
  return (
    <View className={`border-3 ${focused ? 'border-info' : 'border-transparent'} ${className}`}>
      {children}
    </View>
  );
}
