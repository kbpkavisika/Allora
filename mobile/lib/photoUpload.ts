const CLOUD_NAME = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

const MIME: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  heic: 'image/heic',
};

function extensionOf(uri: string) {
  const match = /\.([a-zA-Z0-9]+)(?:\?.*)?$/.exec(uri);
  return (match?.[1] ?? 'jpg').toLowerCase();
}

/**
 * Photos arrive as on-device `file://` uris from the picker, while anything already on Cloudinary
 * comes back as an `https://` url that must be left alone.
 */
export function uploadPhoto(uri: string): Promise<string> {
  return uri.startsWith('http') ? Promise.resolve(uri) : upload(uri);
}

async function upload(uri: string) {
  if (!CLOUD_NAME || !UPLOAD_PRESET) {
    throw new Error('Cloudinary is not configured.');
  }

  const extension = extensionOf(uri);
  const form = new FormData();

  // React Native's FormData takes a file descriptor rather than a Blob, which the DOM lib
  // that ships with TypeScript has no type for.
  form.append('file', {
    uri,
    name: `photo.${extension}`,
    type: MIME[extension] ?? 'image/jpeg',
  } as unknown as Blob);
  form.append('upload_preset', UPLOAD_PRESET);

  const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
    method: 'POST',
    body: form,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.error?.message ?? 'Uploading the photo failed.');
  }

  return data.secure_url as string;
}

export function uploadProductPhotos(uris: string[]) {
  return Promise.all(uris.map(uploadPhoto));
}
