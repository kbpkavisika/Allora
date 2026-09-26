import { supabase } from '@/lib/supabase';

export interface PaymentOtpRequestResult {
  success: boolean;
  maskedPhone: string;
  expiresInSeconds: number;
}

export async function requestPaymentOtp(): Promise<PaymentOtpRequestResult> {
  const { data, error } = await supabase.functions.invoke('request-payment-otp', {
    body: {},
  });

  if (error) throw new Error(error.message || 'Could not request a payment OTP.');

  const result = data as Partial<PaymentOtpRequestResult> | null;
  if (!result?.success || !result.maskedPhone || typeof result.expiresInSeconds !== 'number') {
    throw new Error('Invalid payment OTP response.');
  }

  return {
    success: true,
    maskedPhone: result.maskedPhone,
    expiresInSeconds: result.expiresInSeconds,
  };
}
