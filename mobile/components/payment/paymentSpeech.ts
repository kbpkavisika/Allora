import type { PaymentResult as PaymentResultData } from '@/services/payment/paymentTypes';

const CURRENCY_NAMES: Record<string, string> = {
  AED: 'UAE dirhams',
  AUD: 'Australian dollars',
  CAD: 'Canadian dollars',
  EUR: 'euros',
  GBP: 'British pounds',
  INR: 'Indian rupees',
  LKR: 'Sri Lankan rupees',
  SGD: 'Singapore dollars',
  USD: 'US dollars',
};

function integerToWords(value: number): string {
  if (value < 0) return `minus ${integerToWords(Math.abs(value))}`;
  if (value < 20) {
    return [
      'zero',
      'one',
      'two',
      'three',
      'four',
      'five',
      'six',
      'seven',
      'eight',
      'nine',
      'ten',
      'eleven',
      'twelve',
      'thirteen',
      'fourteen',
      'fifteen',
      'sixteen',
      'seventeen',
      'eighteen',
      'nineteen',
    ][value];
  }

  if (value < 100) {
    const tens = Math.floor(value / 10);
    const remainder = value % 10;
    const word = ['twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'][tens - 2];
    return remainder === 0 ? word : `${word} ${integerToWords(remainder)}`;
  }

  if (value < 1000) {
    const hundreds = Math.floor(value / 100);
    const remainder = value % 100;
    const word = `${integerToWords(hundreds)} hundred`;
    return remainder === 0 ? word : `${word} ${integerToWords(remainder)}`;
  }

  if (value < 1_000_000) {
    const thousands = Math.floor(value / 1000);
    const remainder = value % 1000;
    const word = `${integerToWords(thousands)} thousand`;
    return remainder === 0 ? word : `${word} ${integerToWords(remainder)}`;
  }

  if (value < 1_000_000_000) {
    const millions = Math.floor(value / 1_000_000);
    const remainder = value % 1_000_000;
    const word = `${integerToWords(millions)} million`;
    return remainder === 0 ? word : `${word} ${integerToWords(remainder)}`;
  }

  return String(value);
}

export function formatCurrencyName(currency: string): string {
  const normalized = currency.trim().toUpperCase();
  return CURRENCY_NAMES[normalized] ?? `${normalized || 'local'} currency`;
}

export function formatAmountForSpeech(amount: number): string {
  const roundedAmount = Number.isFinite(amount) ? Math.trunc(amount) : 0;
  if (roundedAmount === 0) return 'zero';
  return integerToWords(Math.abs(roundedAmount));
}

export function formatPaymentConfirmationSpeech({
  amount,
  currency,
  actionLabel = 'Pay',
}: {
  amount: number;
  currency: string;
  actionLabel?: string;
}): string {
  return `You are about to pay ${formatAmountForSpeech(amount)} ${formatCurrencyName(currency)}. Press ${actionLabel} to continue.`;
}

export function formatPaymentAuthenticationSpeech(maskedPhone?: string | null): string {
  const base = 'Payment authentication is required. A six digit verification code was sent to your phone. Enter the six digit code to continue.';
  if (!maskedPhone) return base;

  const tail = maskedPhone.match(/\d{4}$/)?.[0] ?? maskedPhone;
  return `Payment authentication is required. A six digit verification code was sent to your phone ending in ${tail}. Enter the six digit code to continue.`;
}

export function formatPaymentResultSpeech(
  result: PaymentResultData,
  amount?: number,
  currency?: string,
): string {
  const reference = result.reference
    ? ` Your payment reference is ${result.reference}.`
    : ' No payment reference is available.';
  const message = result.message?.trim();

  switch (result.state) {
    case 'success': {
      const hasAmount = typeof amount === 'number' && Number.isFinite(amount);
      const hasCurrency = typeof currency === 'string' && currency.trim().length > 0;

      if (hasAmount && hasCurrency) {
        const amountText = `${formatAmountForSpeech(amount)} ${formatCurrencyName(currency)}`;
        return `Payment successful. Your payment of ${amountText} was completed successfully.${reference}`;
      }
      const detail = message || 'Your payment was completed successfully.';
      return `Payment successful. ${detail.replace(/\.$/, '')}.${reference}`;
    }
    case 'failed': {
      const detail = message || 'The payment was unsuccessful.';
      return `Payment failed. ${detail.replace(/\.$/, '')}.${reference}`;
    }
    case 'cancelled': {
      const detail = message || 'The payment was cancelled.';
      return `Payment was cancelled. ${detail.replace(/\.$/, '')}.${reference}`;
    }
    case 'pending': {
      const detail = message || 'Your payment is still being processed.';
      return `Your payment is still being processed. ${detail.replace(/\.$/, '')}.${reference}`;
    }
    case 'authentication_required': {
      const detail = message || 'Enter the six digit verification code sent to your phone.';
      return `Payment authentication is required. ${detail.replace(/\.$/, '')}.${reference}`;
    }
    default:
      return `Your payment is still being processed.${reference}`;
  }
}

export function formatCheckoutResultSpeech({
  variant,
  amount,
  currency = 'LKR',
  reference,
  message,
}: {
  variant: 'success' | 'failure' | 'cod';
  amount: number;
  currency?: string;
  reference?: string;
  message?: string;
}): string {
  const referenceText = reference
    ? ` Your payment reference is ${reference}.`
    : ' No payment reference is available.';
  const amountText = `${formatAmountForSpeech(amount)} ${formatCurrencyName(currency)}`;

  if (variant === 'success') {
    return `Payment successful. Your payment of ${amountText} was completed successfully.${referenceText}`;
  }

  if (variant === 'cod') {
    return `Order placed. Pay ${amountText} in cash when your order arrives.`;
  }

  const detail = message || "The payment wasn't completed, so your order was not placed.";
  return `Payment failed. ${detail.replace(/\.$/, '')}.${referenceText}`;
}
