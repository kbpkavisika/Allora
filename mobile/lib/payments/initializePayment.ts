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
