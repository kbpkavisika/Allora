import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeOut, useReducedMotion } from 'react-native-reanimated';

export function BrandSplash() {
  const reduceMotion = useReducedMotion();

  return (
    <Animated.View
      style={StyleSheet.absoluteFill}
      exiting={reduceMotion ? undefined : FadeOut.duration(250)}
    >
      <View className="flex-1 items-center justify-center gap-[8px] bg-surface">
        <View className="flex-row items-end gap-[6px]">
          <Text
            role="heading"
            aria-label="Allora"
            maxFontSizeMultiplier={1.2}
            className="type-splash text-primary"
          >
            allora
          </Text>
          <View className="mb-[9px] h-3 w-3 bg-accent" aria-hidden />
        </View>
        <Text className="type-text-lg text-secondary" maxFontSizeMultiplier={1.5}>
          A marketplace built for everyone
        </Text>
      </View>
    </Animated.View>
  );
}
