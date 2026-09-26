// @ts-nocheck

type SendOtpSmsInput = {
  phone: string;
  code: string;
  message: string;
};

export async function sendOtpSms({ phone, code, message }: SendOtpSmsInput): Promise<void> {
  const smsUrl = Deno.env.get('PAYMENT_OTP_SMS_URL');
  if (!smsUrl) {
    throw new Error('Payment OTP SMS provider is not configured.');
  }

  const headers = new Headers({ 'Content-Type': 'application/json' });
  const token = Deno.env.get('PAYMENT_OTP_SMS_TOKEN');
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(smsUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify({ phone, code, message }),
  });

  if (!response.ok) {
    throw new Error('Payment OTP SMS provider rejected the request.');
  }
}
