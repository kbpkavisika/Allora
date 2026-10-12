import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

export interface StepProgressProps {
  current: number;
  total: number;
  className?: string;
}

export function StepProgress({ current, total, className = '' }: StepProgressProps) {
  const { t } = useTranslation();

  return (
    <View
      role="progressbar"
      aria-label={t('a11y.step', { current, total })}
      aria-valuemin={1}
      aria-valuemax={total}
      aria-valuenow={current}
      className={`flex-row gap-1 ${className}`}>
      {Array.from({ length: total }, (_, index) => (
        <View
          key={index}
          className={`h-1 flex-1 ${index < current ? 'bg-info' : 'bg-border'}`}
        />
      ))}
    </View>
  );
}
