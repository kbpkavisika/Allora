import { supabase } from '@/lib/supabase';

export interface PayHerePaymentInitializationResult {
  paymentId: string;
  payHereOrderId: string;
  amount: number;
  currency: string;
}

export function isPayHereInitializationUnavailable(error: unknown): boolean {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    if (
      message.includes('failed to fetch') ||
      message.includes('network') ||
      message.includes('not deployed') ||
      message.includes('not available') ||
      message.includes('temporarily unavailable')
    ) {
      return true;
    }
  }

  if (typeof error === 'string') {
    const message = error.toLowerCase();
    return (
      message.includes('failed to fetch') ||
      message.includes('network') ||
      message.includes('not deployed') ||
      message.includes('not available') ||
      message.includes('temporarily unavailable')
    );
  }

  return false;
}

async function parseErrorResponse(response: Response): Promise<string> {
  try {
    const payload = (await response.json()) as { error?: string };
    if (payload?.error) {
      return payload.error;
    }
  } catch {
    // Ignore invalid JSON and fall back to the status message.
  }

  return `Payment initialization failed (${response.status}).`;
}

export async function initializePayHerePayment(
  amount: number
): Promise<PayHerePaymentInitializationResult> {
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  const accessToken = sessionData.session?.access_token;

  if (sessionError || !accessToken) {
    throw new Error('Authentication required to initialize PayHere payment.');
  }

  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) {
    throw new Error('Payment service is not configured.');
  }

  const response = await fetch(`${supabaseUrl}/functions/v1/initialize-payhere-payment`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amount,
      currency: 'LKR',
    }),
  });

  if (!response.ok) {
    const errorMessage = await parseErrorResponse(response);

    if (response.status === 404 || response.status === 502 || response.status === 503) {
      throw new Error('initialize-payhere-payment is not deployed yet.');
    }

    throw new Error(errorMessage);
  }

  const payload = (await response.json()) as Partial<PayHerePaymentInitializationResult>;

  if (!payload.paymentId || !payload.payHereOrderId || !payload.amount || !payload.currency) {
    throw new Error('Invalid payment initialization response.');
  }

  return {
    paymentId: payload.paymentId,
    payHereOrderId: payload.payHereOrderId,
    amount: Number(payload.amount),
    currency: payload.currency,
  };
}
