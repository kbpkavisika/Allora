import { useFocusEffect } from 'expo-router';
import { useCallback, useRef } from 'react';
import { AccessibilityInfo, type Text } from 'react-native';

export function useScreenTitleFocus() {
  const titleRef = useRef<Text>(null);

  useFocusEffect(
    useCallback(() => {
      if (titleRef.current) {
        AccessibilityInfo.sendAccessibilityEvent(titleRef.current, 'focus');
      }
    }, [])
  );

  return titleRef;
}
