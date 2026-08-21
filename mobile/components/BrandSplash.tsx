import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeOut, useReducedMotion } from 'react-native-reanimated';

export function BrandSplash() {
  const reduceMotion = useReducedMotion();

  return (
    <Animated.View
      style={StyleSheet.absoluteFill}
      exiting={reduceMotion ? undefined : FadeOut.duration(250)}
    >
      <View className="flex-1 items-center justify-center bg-surface">
        <Text
          role="heading"
          aria-label="Allora"
          maxFontSizeMultiplier={1.2}
          className="type-splash text-primary"
        >
          Allora
        </Text>
      </View>
    </Animated.View>
  );
}
