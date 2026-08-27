import { Image } from 'expo-image';
import { Pressable, Text, View } from 'react-native';

import { Badge } from '@/components/ui/Badge';
import { Icon } from '@/components/ui/Icon';
import { pickImage } from '@/lib/imagePicker';

const COLUMNS = 3;

export interface ProductPhotoGridProps {
  photos: string[];
  onChange: (photos: string[]) => void;
  label?: string;
  max?: number;
  error?: string | null;
  className?: string;
}

export function ProductPhotoGrid({
  photos,
  onChange,
  label,
  max = 6,
  error,
  className = '',
}: ProductPhotoGridProps) {
  const hasError = Boolean(error);
  const isFull = photos.length >= max;

  const slots: (string | null)[] = Array.from({ length: max }, (_, index) => photos[index] ?? null);
  const rows: (string | null)[][] = [];
  for (let index = 0; index < slots.length; index += COLUMNS) {
    rows.push(slots.slice(index, index + COLUMNS));
  }

  async function addPhoto() {
    if (isFull) {
      return;
    }

    const uri = await pickImage({ allowCamera: true, title: 'Add product photo' });
    if (uri) {
      onChange([...photos, uri]);
    }
  }

  function removePhoto(index: number) {
    onChange(photos.filter((_, current) => current !== index));
  }

  return (
    <View className={className}>
      {label ? (
        <Text
          className={`type-label-lg mb-1 ${hasError ? 'text-error' : 'text-primary'}`}
          maxFontSizeMultiplier={2}>
          {label}
        </Text>
      ) : null}

      <View className="gap-2">
        {rows.map((row, rowIndex) => (
          <View key={rowIndex} className="flex-row gap-2">
            {row.map((uri, columnIndex) => {
              const index = rowIndex * COLUMNS + columnIndex;
              const isCover = index === 0;

              if (uri) {
                return (
                  <View
                    key={index}
                    style={{ aspectRatio: 1 }}
                    className="flex-1 overflow-hidden rounded-8 border-1 border-border bg-surface-sunken">
                    <Image
                      source={{ uri }}
                      style={{ width: '100%', height: '100%' }}
                      contentFit="cover"
                    />

                    <Pressable
                      onPress={() => removePhoto(index)}
                      role="button"
                      aria-label={`Remove photo ${index + 1}`}
                      hitSlop={8}
                      className="absolute right-1 top-1 h-5 w-5 items-center justify-center rounded-full bg-error">
                      <Icon name="close" size="sm" className="text-surface" />
                    </Pressable>

                    {isCover ? <Badge label="Cover" variant="dark" className="absolute bottom-1 left-1" /> : null}
                  </View>
                );
              }

              return (
                <Pressable
                  key={index}
                  onPress={addPhoto}
                  disabled={isFull}
                  role="button"
                  aria-label={isCover ? 'Add cover photo' : `Add photo ${index + 1}`}
                  style={{ aspectRatio: 1 }}
                  className={`flex-1 items-center justify-center gap-1 rounded-8 bg-surface-sunken ${
                    hasError ? 'border-1.5 border-error' : 'border-1 border-border-strong'
                  }`}>
                  <Icon name="plus" size="md" className="text-secondary" />
                  {isCover ? (
                    <Text className="type-label-sm text-secondary" maxFontSizeMultiplier={1.5}>
                      Cover
                    </Text>
                  ) : null}
                </Pressable>
              );
            })}
          </View>
        ))}
      </View>

      {hasError ? (
        <Text
          role="alert"
          aria-live="assertive"
          className="type-text-primary mt-1 text-error"
          maxFontSizeMultiplier={2}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}
