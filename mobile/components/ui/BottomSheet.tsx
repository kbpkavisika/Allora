import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export interface BottomSheetProps {
  onDismiss: () => void;
  label: string;
  children: React.ReactNode;
}

const SCRIM = 'rgba(16, 17, 18, 0.45)';

export function BottomSheet({ onDismiss, label, children }: BottomSheetProps) {
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 justify-end" style={{ backgroundColor: SCRIM }}>
      <Pressable
        onPress={onDismiss}
        role="button"
        aria-label={`Close ${label.toLowerCase()}`}
        className="flex-1"
      />

      <View
        role="dialog"
        aria-label={label}
        className="rounded-t-16 bg-surface px-5 pb-5 pt-3"
        style={{
          maxHeight: '85%',
          paddingBottom: insets.bottom + 20,
          shadowColor: '#101112',
          shadowOpacity: 0.16,
          shadowRadius: 40,
          shadowOffset: { width: 0, height: -16 },
          elevation: 24,
        }}>
        <View className="mb-4 h-1 w-10 self-center rounded-full bg-inert" aria-hidden />
        {children}
      </View>
    </View>
  );
}
