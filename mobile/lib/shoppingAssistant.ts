import type { SupabaseClient } from '@supabase/supabase-js';
import type { Product } from '@/lib/products';

export interface ShoppingAction {
  type: 'search' | 'add' | 'reply';
  productId: string;
  quantity: number;
  message: string;
}

export async function applyShoppingAction(
  action: ShoppingAction,
  products: Product[],
  addItem: (id: string, quantity: number) => Promise<{ error: unknown }>,
): Promise<Product | null> {
  if (action.type === 'search' || action.type === 'reply') return null;
  if (action.type !== 'add') throw new Error('Unsupported shopping action.');
  const product = products.find((item) => item.id === action.productId);
  if (!product || !Number.isInteger(action.quantity) || action.quantity < 1 || action.quantity > 100) {
    throw new Error('Please choose a product from the results and a quantity from 1 to 100.');
  }
  const { error } = await addItem(product.id, action.quantity);
  if (error) throw error;
  return product;
}

export async function invokeShoppingAssistant(
  client: Pick<SupabaseClient, 'auth' | 'functions'>,
  body: { messages: { role: 'user' | 'assistant'; content: string }[]; productIds: string[] },
) {
  const messages: typeof body.messages = [];
  let historyLength = 0;
  for (const message of body.messages.slice(-12).reverse()) {
    if (historyLength + message.content.length > 16000) break;
    messages.unshift(message);
    historyLength += message.content.length;
  }
  if (!messages.length || messages.at(-1)?.role !== 'user') throw new Error('Invalid shopping request.');
  const accessToken = await getFreshAccessToken(client);
  return client.functions.invoke('shopping-assistant', {
    body: { ...body, messages }, headers: { Authorization: 'Bearer ' + accessToken }, timeout: 45000,
  });
}

export async function getFreshAccessToken(client: Pick<SupabaseClient, 'auth'>) {
  const { data, error } = await client.auth.getSession();
  let session = data.session;
  if (error || !session?.access_token) throw new Error('Please sign in again.');
  if (!session.expires_at || session.expires_at * 1000 <= Date.now() + 60000) {
    const refreshed = await client.auth.refreshSession();
    session = refreshed.data.session;
    if (refreshed.error || !session?.access_token || !session.expires_at || session.expires_at * 1000 <= Date.now()) {
      throw new Error('Please sign in again.');
    }
  }
  return session.access_token;
}

export async function readShoppingFailure(response: Response) {
  const body = await response.json().catch(() => null);
  return {
    error: typeof body?.error === 'string' ? body.error : undefined,
    code: typeof body?.code === 'string' ? body.code : body ? 'unclassified_http_error' : 'non_json_http_error',
    requestId: typeof body?.requestId === 'string' ? body.requestId : response.headers.get('x-request-id') ?? undefined,
    gatewayRequestId: response.headers.get('sb-request-id') ?? response.headers.get('x-sb-request-id') ?? undefined,
    retryAfter: typeof body?.retryAfter === 'number' ? body.retryAfter : Number(response.headers.get('retry-after')) || undefined,
  };
}
