import { supabase } from '@/lib/supabase';

export interface PayHerePaymentInitializationResult {
  paymentId: string;
  payHereOrderId: string;
  amount: number;
  currency: string;
}

interface StartPayHerePaymentRow {
  payment_id: string;
  payhere_order_id: string;
  amount: number | string;
  currency: string;
}

export async function initializePayHerePayment(
  orderIds: string[]
): Promise<PayHerePaymentInitializationResult> {
  const edgeUrl = process.env.EXPO_PUBLIC_PAYHERE_INITIALIZE_URL?.trim();

  if (edgeUrl) {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;

      const response = await fetch(edgeUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ orderIds, order_ids: orderIds }),
      });

      if (response.ok) {
        const payload = await response.json();
        const paymentId = payload.paymentId ?? payload.payment_id;
        const payHereOrderId = payload.payHereOrderId ?? payload.payhere_order_id;
        const amount = Number(payload.amount);
        const currency = payload.currency ?? 'LKR';

        if (paymentId && payHereOrderId && !isNaN(amount)) {
          return {
            paymentId,
            payHereOrderId,
            amount,
            currency,
          };
        }
      }
    } catch {
      // Fallback to direct RPC call below
    }
  }

  const { data, error } = await supabase
    .rpc('start_payhere_payment', { p_order_ids: orderIds })
    .single<StartPayHerePaymentRow>();

  if (error || !data) {
    throw error ?? new Error('Invalid payment initialization response.');
  }

  return {
    paymentId: data.payment_id,
    payHereOrderId: data.payhere_order_id,
    amount: Number(data.amount),
    currency: data.currency,
  };
}

export async function abandonPayHereCheckout(orderIds: string[]): Promise<{ error: unknown }> {
  const { error } = await supabase.rpc('abandon_payhere_checkout', { p_order_ids: orderIds });
  return { error };
}
