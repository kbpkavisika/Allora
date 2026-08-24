import * as WebBrowser from 'expo-web-browser';

export type PaymentOutcomeStatus = 'success' | 'failure';

export interface PayHereCheckoutInput {
  orderId: string;
  amountLkr: number;
}

export interface PaymentOutcome {
  status: PaymentOutcomeStatus;
  reference: string;
  message: string;
}

function buildReference(orderId: string) {
  return `PH-${orderId}-${Date.now()}`;
}

export async function startPayHereCheckout({ orderId, amountLkr }: PayHereCheckoutInput): Promise<PaymentOutcome> {
  const reference = buildReference(orderId);
  const mockResult = process.env.EXPO_PUBLIC_PAYHERE_MOCK_RESULT;

  if (mockResult === 'failure') {
    return {
      status: 'failure',
      reference,
      message: 'Payment was declined. Please try again or use another method.',
    };
  }

  if (mockResult === 'success') {
    return {
      status: 'success',
      reference,
      message: 'Payment completed successfully.',
    };
  }

  const checkoutUrl = process.env.EXPO_PUBLIC_PAYHERE_CHECKOUT_URL;

  if (!checkoutUrl) {
    return {
      status: 'failure',
      reference,
      message: 'PayHere checkout URL is not configured.',
    };
  }

  const query = new URLSearchParams({
    orderId,
    amount: amountLkr.toFixed(2),
    currency: 'LKR',
  });

  const result = await WebBrowser.openBrowserAsync(`${checkoutUrl}?${query.toString()}`);

  if (result.type === 'cancel' || result.type === 'dismiss') {
    return {
      status: 'failure',
      reference,
      message: 'Payment was canceled before confirmation.',
    };
  }

  return {
    status: 'success',
    reference,
    message: 'Payment submitted. Final verification should be completed by backend confirmation.',
  };
}
