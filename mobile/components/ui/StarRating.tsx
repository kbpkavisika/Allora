import { Pressable, View } from 'react-native';

import { Icon, SolidIcon, type IconSize } from '@/components/ui/Icon';

const MAX = 5;

export interface StarRatingProps {
  value: number;
  size?: IconSize;
  onChange?: (next: number) => void;
  label?: string;
  className?: string;
}

export function StarRating({
  value,
  size = 'sm',
  onChange,
  label,
  className = '',
}: StarRatingProps) {
  const stars = Array.from({ length: MAX }, (_, index) => index + 1);
  const summary = label ?? `${value} out of ${MAX} stars`;

  if (!onChange) {
    return (
      <View
        role="img"
        aria-label={summary}
        className={`flex-row items-center gap-0.5 ${className}`}>
        {stars.map((star) => (
          <Star key={star} filled={star <= Math.round(value)} size={size} />
        ))}
      </View>
    );
  }

  return (
    <View role="radiogroup" aria-label={summary} className={`flex-row items-center ${className}`}>
      {stars.map((star) => (
        <Pressable
          key={star}
          onPress={() => onChange(star)}
          role="radio"
          aria-checked={star === value}
          aria-label={`${star} ${star === 1 ? 'star' : 'stars'}`}
          className="h-tap w-tap items-center justify-center">
          <Star filled={star <= value} size={size} />
        </Pressable>
      ))}
    </View>
  );
}

function Star({ filled, size }: { filled: boolean; size: IconSize }) {
  return filled ? (
    <SolidIcon name="star" size={size} className="text-primary" />
  ) : (
    <Icon name="star" size={size} className="text-inert" />
  );
}
