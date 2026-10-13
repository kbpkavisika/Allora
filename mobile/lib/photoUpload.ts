import { uploadErrorMessage, uploadToCloudinary } from '@/lib/cloudinary';

/**
 * Photos arrive as on-device `file://` uris from the picker, while anything already on Cloudinary
 * comes back as an `https://` url that must be left alone.
 */
export function uploadPhoto(uri: string): Promise<string> {
  return uri.startsWith('http') ? Promise.resolve(uri) : uploadToCloudinary(uri, 'image');
}

export const photoUploadErrorMessage = uploadErrorMessage;

export function uploadProductPhotos(uris: string[]) {
  return Promise.all(uris.map(uploadPhoto));
}
