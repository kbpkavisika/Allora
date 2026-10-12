// @ts-nocheck

export class SmsDeliveryError extends Error {
  httpStatus?: number;
  category: string;

  constructor(message: string, category: string, httpStatus?: number) {
    super(message);
    this.name = 'SmsDeliveryError';
    this.category = category;
    this.httpStatus = httpStatus;
  }
}

type SendOtpSmsInput = {
  phone: string;
  code: string;
  message: string;
};

function normalizeSriLankanPhoneNumber(rawPhone: string): string | null {
  const trimmedPhone = rawPhone.trim();
  if (!trimmedPhone) return null;

  const digitsOnly = trimmedPhone.replace(/\D/g, '');
  if (!digitsOnly) return null;

  let normalizedDigits = digitsOnly;
  if (normalizedDigits.startsWith('0')) {
    normalizedDigits = `94${normalizedDigits.slice(1)}`;
  }

  if (!/^94[1-9]\d{8}$/.test(normalizedDigits)) {
    return null;
  }

  return `+${normalizedDigits}`;
}

export function formatOtpSmsMessage(code: string): string {
  return `Your Allora payment code is ${code}. Expires in 5 minutes. Do not share this code.`;
}

export async function sendOtpSms({ phone, message }: SendOtpSmsInput): Promise<void> {
  const apiKey = Deno.env.get('TEXTBEE_API_KEY')?.trim();
  if (!apiKey) {
    throw new SmsDeliveryError('TextBee API key is missing.', 'configuration_missing');
  }

  const normalizedPhone = normalizeSriLankanPhoneNumber(phone);
  if (!normalizedPhone) {
    throw new SmsDeliveryError('Recipient phone is invalid for SMS delivery.', 'invalid_recipient');
  }

  const simSubscriptionId = Deno.env.get('TEXTBEE_SIM_SUBSCRIPTION_ID')?.trim();
  const deviceId = Deno.env.get('TEXTBEE_DEVICE_ID')?.trim();

  const payload: Record<string, unknown> = {
    recipients: [normalizedPhone],
    message,
  };

  if (simSubscriptionId) {
    const parsedId = Number(simSubscriptionId);
    if (Number.isFinite(parsedId)) {
      payload.simSubscriptionId = parsedId;
    }
  }

  if (deviceId) {
    payload.deviceId = deviceId;
  }

  const response = await fetch('https://api.textbee.dev/api/v1/gateway/send-sms', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const status = response.status;
    let category = 'provider_rejected';

    if (status === 401 || status === 403) {
      category = 'authentication_failed';
    } else if (status >= 500) {
      category = 'provider_server_error';
    } else if (status === 429) {
      category = 'rate_limited';
    }

    throw new SmsDeliveryError('TextBee rejected the OTP delivery request.', category, status);
  }

  try {
    const responseBody = (await response.json()) as Record<string, unknown> | null;
    const batchId =
      (responseBody && typeof responseBody === 'object'
        ? (responseBody.id ?? responseBody.batchId ?? responseBody.batch_id ?? responseBody.data)
        : undefined) ?? null;

    console.log(
      JSON.stringify({
        provider: 'textbee',
        accepted: true,
        smsBatchIdPresent: Boolean(batchId),
      }),
    );
  } catch {
    console.log(JSON.stringify({ provider: 'textbee', accepted: true, smsBatchIdPresent: false }));
  }
}
