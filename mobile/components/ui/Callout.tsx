import { Text, View } from 'react-native';

export type CalloutTone = 'info' | 'warning';

export interface CalloutProps {
  message: string;
  tone?: CalloutTone;
  className?: string;
}

const CONTAINER: Record<CalloutTone, string> = {
  info: 'border-info bg-info-tint',
  warning: 'border-warning bg-warning-tint',
};

const TEXT: Record<CalloutTone, string> = {
  info: 'text-info',
  warning: 'text-warning',
};

export function Callout({ message, tone = 'info', className = '' }: CalloutProps) {
  return (
    <View role="note" className={`rounded-8 border-1 px-4 py-3 ${CONTAINER[tone]} ${className}`}>
      <Text className={`type-text-secondary ${TEXT[tone]}`} maxFontSizeMultiplier={2}>
        {message}
      </Text>
    </View>
  );
}
