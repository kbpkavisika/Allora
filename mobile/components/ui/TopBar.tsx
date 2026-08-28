import { useRouter } from 'expo-router';
import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/ui/Icon';
import { IconButton } from '@/components/ui/IconButton';

export interface TopBarProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  trailing?: React.ReactNode;
}

export function TopBar({ title, subtitle, showBack = true, trailing }: TopBarProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View className="bg-surface" style={{ paddingTop: insets.top }}>
      <View className="h-[56px] flex-row items-center border-b-1 border-border px-4">
        <View className="w-tap items-start justify-center">
          {showBack ? (
            <IconButton
              icon={<Icon name="back" size="lg" className="text-primary" />}
              label="Go back"
              hint="Returns to the previous screen"
              onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
            />
          ) : null}
        </View>

        <View className="flex-1 items-center justify-center">
          <Text
            role="heading"
            className="type-title text-primary"
            numberOfLines={1}
            maxFontSizeMultiplier={1.5}>
            {title}
          </Text>
          {subtitle ? (
            <Text
              className="type-text-secondary text-secondary"
              numberOfLines={1}
              maxFontSizeMultiplier={1.5}>
              {subtitle}
            </Text>
          ) : null}
        </View>

        <View className="w-tap items-end justify-center">{trailing}</View>
      </View>
    </View>
  );
}
