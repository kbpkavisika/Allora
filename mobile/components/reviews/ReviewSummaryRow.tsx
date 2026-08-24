import { Pressable, Text, View } from 'react-native';

import { Icon } from '@/components/ui/Icon';
import { StarRating } from '@/components/ui/StarRating';
import { formatAverage, formatReviewCount, type RatingSummary } from '@/lib/reviews';

export interface ReviewSummaryRowProps {
  summary: RatingSummary;
  onPress: () => void;
}

export function ReviewSummaryRow({ summary, onPress }: ReviewSummaryRowProps) {
  const hasReviews = summary.total > 0;
  const caption = hasReviews
    ? `${formatAverage(summary.average)} · ${formatReviewCount(summary.total)}`
    : 'Be the first to review this product';

  return (
    <Pressable
      onPress={onPress}
      role="button"
      aria-label={hasReviews ? `Reviews, ${caption}` : 'Reviews, no reviews yet'}
      accessibilityHint="Opens every review for this product"
      className="min-h-tap flex-row items-center gap-3 active:bg-surface-muted">
      <View className="flex-1 gap-1">
        <Text role="heading" className="type-h3 text-primary" maxFontSizeMultiplier={1.5}>
          Reviews
        </Text>
        <View className="flex-row items-center gap-2">
          {hasReviews ? <StarRating value={summary.average} /> : null}
          <Text className="type-text-secondary text-secondary" maxFontSizeMultiplier={2}>
            {caption}
          </Text>
        </View>
      </View>

      <Icon name="forward" size="md" className="text-secondary" />
    </Pressable>
  );
}
