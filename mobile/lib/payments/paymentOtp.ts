import { supabase } from '@/lib/supabase';

export interface PaymentOtpRequestResult {
  success: boolean;
  maskedPhone: string;
  expiresInSeconds: number;
}

export type PaymentOtpVerificationErrorCode =
  | 'invalid_code'
  | 'expired'
  | 'too_many_attempts'
  | 'not_found'
  | 'network'
  | 'unauthorized';

export interface PaymentOtpVerificationSuccess {
  verified: true;
}

export interface PaymentOtpVerificationFailure {
  verified: false;
  error: PaymentOtpVerificationErrorCode;
  message: string;
}

export type PaymentOtpVerificationResult =
  | PaymentOtpVerificationSuccess
  | PaymentOtpVerificationFailure;

async function getSupabaseAccessToken(): Promise<string> {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error) throw new Error(error.message || 'Could not read the current session.');
  if (!session?.access_token) throw new Error('You are not signed in.');

  return session.access_token;
}

function getOtpEndpoint(name: 'EXPO_PUBLIC_PAYMENT_OTP_REQUEST_URL' | 'EXPO_PUBLIC_PAYMENT_OTP_VERIFY_URL') {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`${name} is not configured.`);
  }

  return value;
}

export async function requestPaymentOtp(): Promise<PaymentOtpRequestResult> {
  const requestUrl = getOtpEndpoint('EXPO_PUBLIC_PAYMENT_OTP_REQUEST_URL');
  const authorizationToken = await getSupabaseAccessToken();

  const response = await fetch(requestUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${authorizationToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({}),
  });

  let payload: Partial<PaymentOtpRequestResult> & { error?: string; message?: string } | null = null;

  try {
    payload = (await response.json()) as Partial<PaymentOtpRequestResult> & { error?: string; message?: string };
  } catch {
    payload = null;
  }

  if (!response.ok) {
    throw new Error(payload?.error || payload?.message || 'Could not request a payment OTP.');
  }

  const result = payload as Partial<PaymentOtpRequestResult> | null;
  if (!result?.success || !result.maskedPhone || typeof result.expiresInSeconds !== 'number') {
    throw new Error('Invalid payment OTP response.');
  }

  return {
    success: true,
    maskedPhone: result.maskedPhone,
    expiresInSeconds: result.expiresInSeconds,
  };
}

export async function verifyPaymentOtp(code: string): Promise<PaymentOtpVerificationResult> {
  const normalizedCode = code.trim();
  if (!/^\d{6}$/.test(normalizedCode)) {
    return {
      verified: false,
      error: 'invalid_code',
      message: 'Verification code must be exactly 6 digits.',
    };
  }

  const verifyUrl = getOtpEndpoint('EXPO_PUBLIC_PAYMENT_OTP_VERIFY_URL');
  const authorizationToken = await getSupabaseAccessToken();

  const response = await fetch(verifyUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${authorizationToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ code: normalizedCode }),
  });

  let payload: { verified?: boolean; error?: string; message?: string } | null = null;

  try {
    payload = (await response.json()) as { verified?: boolean; error?: string; message?: string };
  } catch {
    payload = null;
  }

  const supportedErrors = ['invalid_code', 'expired', 'too_many_attempts', 'not_found'];
  const errorCode = typeof payload?.error === 'string' ? payload.error : undefined;

  if (response.ok && payload?.verified === true) {
    return { verified: true };
  }

  if (errorCode && supportedErrors.includes(errorCode)) {
    return {
      verified: false,
      error: errorCode as PaymentOtpVerificationErrorCode,
      message: payload?.message || 'Verification failed.',
    };
  }

  if (response.status === 401 || response.status === 403) {
    return {
      verified: false,
      error: 'unauthorized',
      message: 'Authentication required.',
    };
  }

  return {
    verified: false,
    error: 'network',
    message: payload?.message || 'Could not verify payment code.',
  };
}
