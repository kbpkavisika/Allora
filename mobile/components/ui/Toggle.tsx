import { useEffect, useRef } from 'react';
import { Animated, Pressable } from 'react-native';

export interface ToggleProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  label: string;
  hint?: string;
  disabled?: boolean;
  className?: string;
}

const WIDTH = 52;
const HEIGHT = 32;
const PADDING = 3;
const KNOB_SIZE = 24;
const TRAVEL = WIDTH - PADDING * 2 - KNOB_SIZE;

export function Toggle({
  value,
  onValueChange,
  label,
  hint,
  disabled = false,
  className = '',
}: ToggleProps) {
  const progress = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: value ? 1 : 0,
      duration: 140,
      useNativeDriver: true,
    }).start();
  }, [value, progress]);

  const translateX = progress.interpolate({ inputRange: [0, 1], outputRange: [0, TRAVEL] });

  return (
    <Pressable
      onPress={disabled ? undefined : () => onValueChange(!value)}
      disabled={disabled}
      role="switch"
      aria-checked={value}
      aria-label={label}
      aria-disabled={disabled}
      accessibilityHint={hint}
      hitSlop={8}
      className={`justify-center rounded-full ${
        value ? 'bg-primary' : 'border-1 border-border-strong bg-border'
      } ${disabled ? 'opacity-50' : ''} ${className}`}
      style={{ width: WIDTH, height: HEIGHT, padding: PADDING }}>
      <Animated.View
        style={{
          width: KNOB_SIZE,
          height: KNOB_SIZE,
          borderRadius: KNOB_SIZE / 2,
          backgroundColor: '#FFFFFF',
          shadowColor: '#101112',
          shadowOpacity: 0.2,
          shadowRadius: 2,
          shadowOffset: { width: 0, height: 1 },
          elevation: 2,
          transform: [{ translateX }],
        }}
      />
    </Pressable>
  );
}
