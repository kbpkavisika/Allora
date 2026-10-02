import { FunctionsHttpError, type SupabaseClient } from '@supabase/supabase-js';

import { productVoiceResponseSchema, type ProductVoiceDraft } from '@/lib/schemas';
import { productCategories, type ProductDetailsValues } from '@/lib/sellerSchemas';
import { getFreshAccessToken, readShoppingFailure } from '@/lib/shoppingAssistant';

export class ProductVoiceError extends Error {}

export async function extractProductDraft(
  client: Pick<SupabaseClient, 'auth' | 'functions'>,
  transcript: string,
): Promise<ProductVoiceDraft> {
  const accessToken = await getFreshAccessToken(client);
  const { data, error } = await client.functions.invoke('product-voice', {
    body: { transcript }, headers: { Authorization: 'Bearer ' + accessToken }, timeout: 45000,
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
