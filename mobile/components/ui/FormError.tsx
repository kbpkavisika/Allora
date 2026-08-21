import { Text, View } from 'react-native';

export interface FormErrorProps {
  message?: string | null;
  className?: string;
}

export function FormError({ message, className = '' }: FormErrorProps) {
  if (!message) {
    return null;
  }

  return (
    <View
      role="alert"
      aria-live="assertive"
      className={`rounded-8 border-1 border-error bg-error-tint px-4 py-3 ${className}`}>
      <Text className="type-text-primary text-error" maxFontSizeMultiplier={2}>
        {message}
      </Text>
    </View>
  );
}
