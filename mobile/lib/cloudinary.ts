import { File } from 'expo-file-system';

const CLOUD_NAME = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

// Cloudinary files audio under its "video" resource type.
export type CloudinaryResource = 'image' | 'video';

export class UploadError extends Error {}

export async function uploadToCloudinary(uri: string, resource: CloudinaryResource) {
  try {
    return await send(uri, resource);
  } catch (error) {
    if (error instanceof UploadError) throw error;
    throw new UploadError(error instanceof Error ? error.message : 'Uploading the file failed.');
  }
}

async function send(uri: string, resource: CloudinaryResource) {
  if (!CLOUD_NAME || !UPLOAD_PRESET) {
    throw new UploadError('Cloudinary is not configured.');
  }

  // Expo's fetch rejects React Native's { uri, name, type } descriptor; it needs a real Blob.
  const form = new FormData();
  form.append('file', new File(uri));
  form.append('upload_preset', UPLOAD_PRESET);

  const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${resource}/upload`, {
    method: 'POST',
    body: form,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new UploadError(data?.error?.message ?? 'Uploading the file failed.');
  }

  return data.secure_url as string;
}

export function uploadErrorMessage(error: unknown, fallback: string, uploadFailed: string) {
  if (!(error instanceof UploadError)) return fallback;
  return __DEV__ ? `${uploadFailed} (${error.message})` : uploadFailed;
}
