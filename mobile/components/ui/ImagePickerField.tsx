import Feather from '@expo/vector-icons/Feather';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { Pressable, Text, View } from 'react-native';

import { useThemeColor } from '@/hooks/useThemeColor';

export interface ImagePickerFieldProps {
  label: string;
  imageUri: string | null;
  onChange: (uri: string | null) => void;
  error?: string | null;
  required?: boolean;
  className?: string;
}

export function ImagePickerField({
  label,
  imageUri,
  onChange,
  error,
  required = false,
  className = '',
}: ImagePickerFieldProps) {
  const hasError = Boolean(error);
  const secondaryColor = useThemeColor({}, 'secondary');

  async function pickImage() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      onChange(result.assets[0].uri);
    }
  }

  return (
    <View className={className}>
      <View className="mb-1 flex-row items-center gap-2">
        <Text className={`type-label-lg ${hasError ? 'text-error' : 'text-primary'}`}>
          {label}
        </Text>
        {required ? <Text className="type-text-primary text-secondary">Required</Text> : null}
      </View>

      <Pressable
        onPress={pickImage}
        role="button"
        aria-label={imageUri ? `Change ${label.toLowerCase()}` : `Add ${label.toLowerCase()}`}
        className={`aspect-[3/4] w-40 items-center justify-center overflow-hidden rounded-12 bg-surface-sunken ${
          hasError ? 'border-1.5 border-error' : 'border-1 border-border-strong'
        }`}>
        {imageUri ? (
          <Image
            source={{ uri: imageUri }}
            style={{ width: '100%', height: '100%' }}
            contentFit="cover"
          />
        ) : (
          <View className="items-center gap-2">
            <Feather name="camera" size={24} color={secondaryColor} />
            <Text className="type-text-secondary text-secondary">Add photo</Text>
          </View>
        )}
      </Pressable>

      {imageUri ? (
        <Pressable onPress={() => onChange(null)} className="mt-2 self-start" role="button">
          <Text className="type-label-sm text-secondary underline">Remove photo</Text>
        </Pressable>
      ) : null}

      {hasError ? (
        <Text role="alert" aria-live="assertive" className="type-text-primary mt-1 text-error">
          {error}
        </Text>
      ) : null}
    </View>
  );
}
