import { useEffect } from 'react';
import { AppState } from 'react-native';

export function useAppForeground(onForeground: () => void) {
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') onForeground();
    });

    return () => subscription.remove();
  }, [onForeground]);
}
