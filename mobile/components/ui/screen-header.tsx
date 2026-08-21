import { useRouter } from 'expo-router';
import { Text, View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { IconButton } from '@/components/ui/icon-button';

export interface ScreenHeaderProps {
  title: string;
  className?: string;
}

export function ScreenHeader({ title, className = '' }: ScreenHeaderProps) {
  const router = useRouter();

  return (
    <View className={`gap-6 ${className}`}>
      <IconButton
        variant="outlined"
        diameter={44}
        icon={<Icon name="back" size="lg" className="text-primary" />}
        label="Go back"
        hint="Returns to the previous screen"
        onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
      />
      <Text role="heading" className="type-h1 text-primary" maxFontSizeMultiplier={1.5}>
        {title}
      </Text>
    </View>
  );
}
