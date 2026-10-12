import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { BrandMark } from '@/components/ui/Icon';

export interface SocialAuthButtonsProps {
  onApplePress?: () => void;
  onGooglePress?: () => void;
  className?: string;
}

export function SocialAuthButtons({
  onApplePress,
  onGooglePress,
  className = '',
}: SocialAuthButtonsProps) {
  const { t } = useTranslation();

  return (
    <View className={`gap-3 ${className}`}>
      <Button
        variant="social"
        label={t('auth.social.apple')}
        hint={t('auth.social.appleHint')}
        leadingIcon={<BrandMark name="apple" className="text-primary" />}
        onPress={onApplePress}
      />
      <Button
        variant="social"
        label={t('auth.social.google')}
        hint={t('auth.social.googleHint')}
        leadingIcon={<BrandMark name="google" className="text-primary" />}
        onPress={onGooglePress}
      />
    </View>
  );
}
