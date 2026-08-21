import { View } from 'react-native';

import { Button } from '@/components/ui/button';
import { BrandMark } from '@/components/ui/icon';

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
  return (
    <View className={`gap-3 ${className}`}>
      <Button
        variant="social"
        label="Continue with Apple"
        hint="Opens Apple sign-in"
        leadingIcon={<BrandMark name="apple" className="text-primary" />}
        onPress={onApplePress}
      />
      <Button
        variant="social"
        label="Continue with Google"
        hint="Opens Google sign-in"
        leadingIcon={<BrandMark name="google" className="text-primary" />}
        onPress={onGooglePress}
      />
    </View>
  );
}
