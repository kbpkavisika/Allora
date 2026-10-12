import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

import { useProfile } from '@/hooks/useProfile';

export function useReduceMotion() {
  const { profile, isLoading } = useProfile();
  const [systemReduceMotion, setSystemReduceMotion] = useState(true);

  useEffect(() => {
    let awaitingInitialSetting = true;
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', (enabled) => {
      awaitingInitialSetting = false;
      setSystemReduceMotion(enabled);
    });

    AccessibilityInfo.isReduceMotionEnabled()
      .then((enabled) => {
        if (awaitingInitialSetting) setSystemReduceMotion(enabled);
      })
      .catch(() => {});

    return () => {
      awaitingInitialSetting = false;
      subscription.remove();
    };
  }, []);

  return (isLoading && !profile) || !!profile?.reduce_motion || systemReduceMotion;
}
