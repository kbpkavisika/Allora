import { View } from 'react-native';

import { Elevation } from '@/constants/theme';

export interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export function Card({ children, className = '' }: Readonly<CardProps>) {
  return (
    <View
      style={Elevation.e1}
      className={`overflow-hidden rounded-12 border-1 border-border bg-surface ${className}`}>
      {children}
    </View>
  );
}
