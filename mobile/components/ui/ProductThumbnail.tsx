import { Image } from 'expo-image';
import { View } from 'react-native';

import { Icon, type IconName } from '@/components/ui/Icon';

export type ProductThumbnailSize = 'sm' | 'md' | 'lg';

export interface ProductThumbnailProps {
  uri: string | null | undefined;
  size?: ProductThumbnailSize;
  fallbackIcon?: IconName;
}

const BOX: Record<ProductThumbnailSize, string> = {
  sm: 'h-[44px] w-[44px]',
  md: 'h-[56px] w-[56px]',
  lg: 'h-[72px] w-[72px]',
};

export function ProductThumbnail({ uri, size = 'md', fallbackIcon = 'shop' }: ProductThumbnailProps) {
  return (
    <View
      aria-hidden
      className={`${BOX[size]} items-center justify-center overflow-hidden rounded-8 bg-surface-sunken`}>
      {uri ? (
        <Image source={{ uri }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
      ) : (
        <Icon name={fallbackIcon} size="md" className="text-secondary" />
      )}
    </View>
  );
}
