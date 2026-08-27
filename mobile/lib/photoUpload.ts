import { supabase } from '@/lib/supabase';

const BUCKET = 'product-photos';

function extensionOf(uri: string) {
  const match = /\.([a-zA-Z0-9]+)(?:\?.*)?$/.exec(uri);
  return (match?.[1] ?? 'jpg').toLowerCase();
}

async function uploadPhoto(uri: string, userId: string) {
  const arrayBuffer = await fetch(uri).then((response) => response.arrayBuffer());
  const extension = extensionOf(uri);
  const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, arrayBuffer, {
    contentType: `image/${extension === 'jpg' ? 'jpeg' : extension}`,
  });

  if (error) {
    throw error;
  }

  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

/**
 * Photos arrive as on-device `file://` uris from the picker. Editing an existing product mixes
 * those with the `https://` urls of photos already in the bucket, which must be left as they are.
 */
export function uploadProductPhotos(uris: string[], userId: string) {
  return Promise.all(
    uris.map((uri) => (uri.startsWith('http') ? Promise.resolve(uri) : uploadPhoto(uri, userId)))
  );
}
