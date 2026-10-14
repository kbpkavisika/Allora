import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

import { Icon } from '@/components/ui/Icon';
import { IconButton } from '@/components/ui/IconButton';
import { ReadAloudButton } from '@/components/ui/ReadAloudButton';
import { useScreenTitleFocus } from '@/hooks/useScreenTitleFocus';

export interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  className?: string;
}

export function ScreenHeader({
  title,
  subtitle,
  showBack = true,
  className = '',
}: ScreenHeaderProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const titleRef = useScreenTitleFocus();

  return (
    <View className={`gap-6 ${className}`}>
      <View className={`flex-row items-center ${showBack ? 'justify-between' : 'justify-end'}`}>
        {showBack ? (
          <IconButton
            variant="outlined"
            diameter={44}
            icon={<Icon name="back" size="lg" className="text-primary" />}
            label={t('common.goBack')}
            hint={t('common.previousScreenHint')}
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
          />
        ) : null}
        <ReadAloudButton />
      </View>
      <View className="gap-2">
        <Text ref={titleRef} role="heading" className="type-h1 text-primary" maxFontSizeMultiplier={1.5}>
          {title}
        </Text>
        {subtitle ? (
          <Text className="type-text-lg text-secondary" maxFontSizeMultiplier={1.5}>
            {subtitle}
          </Text>
        ) : null}
      </View>
    </View>
  );
}
