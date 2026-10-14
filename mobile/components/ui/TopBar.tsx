import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/ui/Icon';
import { IconButton } from '@/components/ui/IconButton';
import { ReadAloudButton } from '@/components/ui/ReadAloudButton';
import { useScreenTitleFocus } from '@/hooks/useScreenTitleFocus';

export interface TopBarProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
}

export function TopBar({ title, subtitle, showBack = true, leading, trailing }: TopBarProps) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const titleRef = useScreenTitleFocus();

  return (
    <View className="bg-surface" style={{ paddingTop: insets.top }}>
      <View className="h-[56px] flex-row items-center border-b-1 border-border px-4">
        <View className="w-tap items-start justify-center">
          {showBack ? (
            <IconButton
              icon={<Icon name="back" size="lg" className="text-primary" />}
              label={t('common.goBack')}
              hint={t('common.previousScreenHint')}
              onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
            />
          ) : leading}
        </View>

        <View className="flex-1 items-center justify-center">
          <Text
            ref={titleRef}
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

        <View className="flex-row items-center justify-end">
          {trailing}
          <ReadAloudButton />
        </View>
      </View>
    </View>
  );
}
