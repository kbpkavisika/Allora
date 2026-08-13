import { Text, View } from 'react-native';

export interface SuccessBannerProps {
  message?: string | null;
  className?: string;
}

export function SuccessBanner({ message, className = '' }: SuccessBannerProps) {
  if (!message) {
    return null;
  }

  return (
    <View
      role="alert"
      aria-live="polite"
      className={`rounded-8 border-1 border-success bg-success-tint px-4 py-3 ${className}`}>
      <Text className="type-text-primary text-success" maxFontSizeMultiplier={2}>
        {message}
      </Text>
    </View>
  );
}
