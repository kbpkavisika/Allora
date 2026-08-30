import { Text, View } from 'react-native';

import { MeterBar } from '@/components/ui/MeterBar';
import { StarRating } from '@/components/ui/StarRating';
import {
  formatAverage,
  formatReviewCount,
  ratingShare,
  STAR_VALUES,
  type RatingSummary as Summary,
} from '@/lib/reviews';

export interface RatingSummaryProps {
  summary: Summary;
  className?: string;
}

export function RatingSummary({ summary, className = '' }: RatingSummaryProps) {
  return (
    <View className={`flex-row items-center gap-5 ${className}`}>
      <View className="gap-1">
        <Text className="type-display text-primary" maxFontSizeMultiplier={1.5}>
          {formatAverage(summary.average)}
        </Text>
        <StarRating value={summary.average} />
        <Text className="type-text-primary text-secondary" maxFontSizeMultiplier={2}>
          {formatReviewCount(summary.total)}
        </Text>
      </View>

      <View className="flex-1 gap-2">
        {STAR_VALUES.map((star) => {
          const share = ratingShare(summary, star);

          return (
            <View key={star} className="flex-row items-center gap-2">
              <Text className="type-label-sm text-secondary" maxFontSizeMultiplier={1.5}>
                {star}
              </Text>
              <MeterBar
                value={share}
                label={`${star} ${star === 1 ? 'star' : 'stars'}`}
                className="flex-1"
              />
              <Text
                className="type-mono w-8 text-right text-secondary"
                maxFontSizeMultiplier={1.5}>
                {Math.round(share * 100)}%
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}
