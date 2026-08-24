import { Image } from 'expo-image';
import { Text, View } from 'react-native';

import { Avatar } from '@/components/ui/Avatar';
import { StarRating } from '@/components/ui/StarRating';
import { reviewerName, reviewMeta, type Review } from '@/lib/reviews';

export interface ReviewCardProps {
  review: Review;
}

export function ReviewCard({ review }: ReviewCardProps) {
  const name = reviewerName(review.author?.full_name ?? null);

  return (
    <View className="gap-3">
      <View className="flex-row items-center gap-3">
        <Avatar name={review.author?.full_name ?? null} />
        <View className="flex-1 gap-0.5">
          <Text className="type-h3 text-primary" numberOfLines={1} maxFontSizeMultiplier={1.5}>
            {name}
          </Text>
          <Text className="type-text-secondary text-secondary" maxFontSizeMultiplier={2}>
            {reviewMeta(review)}
          </Text>
        </View>
      </View>

      <View className="flex-row items-center gap-2">
        <StarRating value={review.rating} label={`${name} rated this ${review.rating} out of 5`} />
        <Text className="type-label-lg flex-1 text-primary" maxFontSizeMultiplier={2}>
          {review.headline}
        </Text>
      </View>

      <Text className="type-text-lg text-primary" maxFontSizeMultiplier={2}>
        {review.body}
      </Text>

      {review.photos.length > 0 ? (
        <View className="flex-row gap-2">
          {review.photos.map((uri, index) => (
            <View
              key={uri}
              className="h-16 w-16 overflow-hidden rounded-8 border-1 border-border bg-surface-sunken">
              <Image
                source={{ uri }}
                style={{ width: '100%', height: '100%' }}
                contentFit="cover"
                alt={`Photo ${index + 1} from ${name}'s review`}
              />
            </View>
          ))}
        </View>
      ) : null}

      {review.helpful_count > 0 ? (
        <Text className="type-text-secondary text-secondary" maxFontSizeMultiplier={2}>
          Helpful · {review.helpful_count}
        </Text>
      ) : null}
    </View>
  );
}
