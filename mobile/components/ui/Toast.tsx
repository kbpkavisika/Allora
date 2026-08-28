import * as Haptics from 'expo-haptics';
import { useEffect } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/ui/Icon';
import { Elevation } from '@/constants/theme';

export interface ToastProps {
  message: string | null;
  actionLabel?: string;
  onAction?: () => void;
  onDismiss: () => void;
  durationMs?: number;
  // Extra bottom offset when the screen has its own pinned footer to clear.
  offset?: number;
}

// design.md §08: "Toasts sit above the tab bar for 4s." Presentational and controlled — the
// screen owns the message state so a screen reader also reaches it through role="alert".
export function Toast({
  message,
  actionLabel,
  onAction,
  onDismiss,
  durationMs = 4000,
  offset = 0,
}: ToastProps) {
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (!message) return;

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const timer = setTimeout(onDismiss, durationMs);
    return () => clearTimeout(timer);
  }, [message, durationMs, onDismiss]);

  if (!message) {
    return null;
  }

  return (
    <View
      pointerEvents="box-none"
      className="absolute inset-x-0 items-center px-4"
      style={{ bottom: insets.bottom + 16 + offset }}>
      <View
        role="alert"
        aria-live="polite"
        style={Elevation.e3}
        className="w-full flex-row items-center gap-3 rounded-12 border-1 border-success bg-surface px-4 py-3">
        <Icon name="check" size="md" className="text-success" />
        <Text className="type-text-primary flex-1 text-primary" maxFontSizeMultiplier={2}>
          {message}
        </Text>
        {actionLabel && onAction ? (
          <Pressable onPress={onAction} role="button" aria-label={actionLabel} hitSlop={8}>
            <Text className="type-label-lg text-primary underline">{actionLabel}</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}
