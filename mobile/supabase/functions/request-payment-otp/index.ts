// @ts-nocheck

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';

import { SmsDeliveryError, formatOtpSmsMessage, sendOtpSms } from '../_shared/paymentOtpSms.ts';

const OTP_EXPIRY_SECONDS = 300;
const MINIMUM_RESEND_INTERVAL_SECONDS = 30;
const HOURLY_REQUEST_LIMIT = 5;

const jsonHeaders = {
  'Content-Type': 'application/json',
};

function getSupabaseSecretKey(): string | null {
  const rawSecretKeys = Deno.env.get('SUPABASE_SECRET_KEYS');
  if (!rawSecretKeys) return null;

  try {
    const secretKeys = JSON.parse(rawSecretKeys) as Record<string, string>;
    return secretKeys.default ?? null;
  } catch {
    return null;
  }
}

function errorResponse(status: number, message: string): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: jsonHeaders,
  });
}

function generateOtp(): string {
  const maximum = 1_000_000 - (1_000_000 % 1_000_000);
  const values = new Uint32Array(1);

  do {
    crypto.getRandomValues(values);
  } while (values[0] >= maximum);

  return String(values[0] % 1_000_000).padStart(6, '0');
}

async function hmacSha256(secret: string, value: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(value));
  return Array.from(new Uint8Array(signature), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

function maskPhone(phone: string): string {
  const visiblePhone = phone.trim();
  const suffix = visiblePhone.slice(-3);
  const prefix = visiblePhone.startsWith('+') ? '+' : '';
  return `${prefix}${'*'.repeat(Math.max(0, visiblePhone.length - prefix.length - suffix.length))}${suffix}`;
}

serve(async (req) => {
  try {
    if (req.method !== 'POST') return errorResponse(405, 'Method not allowed');

    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) return errorResponse(401, 'Unauthorized');

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseSecret = getSupabaseSecretKey();
    const otpSecret = Deno.env.get('PAYMENT_OTP_SECRET');

    if (!supabaseUrl || !supabaseSecret || !otpSecret) {
      return errorResponse(500, 'Payment OTP service is not configured.');
    }

    const supabase = createClient(supabaseUrl, supabaseSecret, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const token = authHeader.slice('Bearer '.length).trim();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) return errorResponse(401, 'Unauthorized');

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('phone')
      .eq('id', user.id)
      .single();

    if (profileError || !profile?.phone?.trim()) {
      return errorResponse(400, 'A phone number is required for payment verification.');
    }

    const phone = profile.phone.trim();
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const minimumResendTime = new Date(
      Date.now() - MINIMUM_RESEND_INTERVAL_SECONDS * 1000,
    ).toISOString();

    const { count: recentCount, error: countError } = await supabase
      .from('payment_otps')
      .select('id', { count: 'exact', head: true })
      .eq('buyer_id', user.id)
      .gte('created_at', oneHourAgo);

    if (countError) return errorResponse(500, 'Could not check OTP request limits.');
    if ((recentCount ?? 0) >= HOURLY_REQUEST_LIMIT) {
      return errorResponse(429, 'Too many OTP requests. Please try again later.');
    }

    const { data: recentOtp, error: recentOtpError } = await supabase
      .from('payment_otps')
      .select('id')
      .eq('buyer_id', user.id)
      .eq('used', false)
      .gte('created_at', minimumResendTime)
      .maybeSingle();

    if (recentOtpError) return errorResponse(500, 'Could not check OTP request limits.');
    if (recentOtp) return errorResponse(429, 'Please wait before requesting another OTP.');

    const code = generateOtp();
    const codeHash = await hmacSha256(otpSecret, `${user.id}:${code}`);
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_SECONDS * 1000).toISOString();

    const { error: invalidateError } = await supabase
      .from('payment_otps')
      .update({ used: true, used_at: new Date().toISOString() })
      .eq('buyer_id', user.id)
      .eq('used', false);

    if (invalidateError) return errorResponse(500, 'Could not prepare payment verification.');

    const { data: otp, error: insertError } = await supabase
      .from('payment_otps')
      .insert({
        buyer_id: user.id,
        phone,
        code_hash: codeHash,
        expires_at: expiresAt,
      })
      .select('id')
      .single();

    if (insertError || !otp) return errorResponse(500, 'Could not create payment verification.');

    const simSubscriptionConfigured = Boolean(Deno.env.get('TEXTBEE_SIM_SUBSCRIPTION_ID')?.trim());

    try {
      await sendOtpSms({
        phone,
        code,
        message: formatOtpSmsMessage(code),
      });
    } catch (deliveryError) {
      await supabase
        .from('payment_otps')
        .update({ used: true, used_at: new Date().toISOString() })
        .eq('id', otp.id);

      const httpStatus = deliveryError instanceof SmsDeliveryError ? deliveryError.httpStatus : undefined;
      const errorCategory = deliveryError instanceof SmsDeliveryError ? deliveryError.category : 'unknown';

      console.error(
        JSON.stringify({
          provider: 'textbee',
          httpStatus,
          errorCategory,
          buyerIdPresent: Boolean(user.id),
          phonePresent: Boolean(phone),
          simSubscriptionConfigured,
        }),
      );

      return errorResponse(503, 'Unable to send verification code.');
    }

    return new Response(
      JSON.stringify({
        success: true,
        expiresInSeconds: OTP_EXPIRY_SECONDS,
        maskedPhone: maskPhone(phone),
      }),
      { status: 200, headers: jsonHeaders },
    );
  } catch {
    return errorResponse(500, 'Payment OTP request failed.');
  }
});
