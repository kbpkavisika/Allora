import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export function Header() {
  const insets = useSafeAreaInsets();

  return (
    <View className="bg-surface" style={{ paddingTop: insets.top }}>
      <View className="h-[56px] justify-center border-b-1 border-border px-4">
        <Text className="type-wordmark text-primary">allora</Text>
      </View>
    </View>
  );
}
