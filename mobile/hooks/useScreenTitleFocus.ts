import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useRef } from 'react';
import { AccessibilityInfo, type Text } from 'react-native';

import { useProfile } from '@/hooks/useProfile';

export function useScreenTitleFocus() {
  const titleRef = useRef<Text>(null);
  const { profile } = useProfile();
  const isEnabled = !!profile?.screen_reader_support;

  useFocusEffect(
    useCallback(() => {
      if (isEnabled && titleRef.current) {
        AccessibilityInfo.sendAccessibilityEvent(titleRef.current, 'focus');
      }
    }, [isEnabled])
  );

  return titleRef;
}
