import * as ImagePicker from 'expo-image-picker';
import { Alert } from 'react-native';
import i18n from '@/lib/i18n';

export interface PickImageOptions {
  aspect?: [number, number];
  allowCamera?: boolean;
  title?: string;
}

async function pickFromLibrary(aspect: [number, number]) {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    return null;
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect,
    quality: 0.8,
  });

  return result.canceled ? null : (result.assets[0]?.uri ?? null);
}

async function pickFromCamera(aspect: [number, number]) {
  const permission = await ImagePicker.requestCameraPermissionsAsync();
  if (!permission.granted) {
    return null;
  }

  const result = await ImagePicker.launchCameraAsync({
    allowsEditing: true,
    aspect,
    quality: 0.8,
  });

  return result.canceled ? null : (result.assets[0]?.uri ?? null);
}

export function pickImage({
  aspect = [3, 4],
  allowCamera = false,
  title = i18n.t('imagePicker.addPhoto'),
}: PickImageOptions = {}): Promise<string | null> {
  if (!allowCamera) {
    return pickFromLibrary(aspect);
  }

  return new Promise((resolve) => {
    Alert.alert(
      title,
      undefined,
      [
        { text: i18n.t('imagePicker.takePhoto'), onPress: () => pickFromCamera(aspect).then(resolve) },
        {
          text: i18n.t('imagePicker.chooseFromLibrary'),
          onPress: () => pickFromLibrary(aspect).then(resolve),
        },
        { text: i18n.t('common.cancel'), style: 'cancel', onPress: () => resolve(null) },
      ],
      { onDismiss: () => resolve(null) }
    );
  });
}
