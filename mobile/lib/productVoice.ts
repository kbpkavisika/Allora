import { FunctionsHttpError, type SupabaseClient } from '@supabase/supabase-js';

import { productVoiceResponseSchema, type ProductVoiceDraft } from '@/lib/schemas';
import { productCategories, type ProductDetailsValues } from '@/lib/sellerSchemas';
import { getFreshAccessToken, readShoppingFailure } from '@/lib/shoppingAssistant';

export const PRODUCT_VOICE_MAX_MS = 2 * 60 * 1000;

export class ProductVoiceError extends Error {}

export async function transcribeProductVoice(
  client: Pick<SupabaseClient, 'auth' | 'functions'>,
  uri: string,
): Promise<ProductVoiceDraft> {
  const accessToken = await getFreshAccessToken(client);
  const extension = uri.split('.').pop()?.toLowerCase() || 'm4a';
  const body = new FormData();
  body.append('audio', { uri, name: 'product.' + extension, type: 'audio/' + (extension === 'm4a' ? 'mp4' : extension) } as unknown as Blob);

  const { data, error } = await client.functions.invoke('product-voice', {
    body, headers: { Authorization: 'Bearer ' + accessToken }, timeout: 55000,
  });

  if (error) {
    const failure = error instanceof FunctionsHttpError ? await readShoppingFailure(error.context) : null;
    console.warn(JSON.stringify({ event: 'product_voice_failed', code: failure?.code ?? error.name, requestId: failure?.requestId }));
    throw new ProductVoiceError(failure?.error ?? error.message);
  }

  return productVoiceResponseSchema.parse(data).product;
}

export function toProductFormValues(draft: ProductVoiceDraft): Partial<ProductDetailsValues> {
  return {
    name: draft.name,
    description: draft.description,
    price: draft.price === null ? '' : String(Math.round(draft.price * 100) / 100),
    stockQuantity: draft.stockQuantity === null ? '' : String(draft.stockQuantity),
    category: (productCategories as readonly string[]).includes(draft.category) ? draft.category : '',
  };
}
