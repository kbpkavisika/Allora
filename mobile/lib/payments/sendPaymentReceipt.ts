export interface SendPaymentReceiptInput {
  buyerEmail: string;
  buyerName: string;
  paymentId: string;
  payHereOrderId: string;
  amount: number;
  currency: string;
  paymentMethod: 'payhere';
  paymentDate: string;
  orders: Array<{
    id?: string;
    order_number?: string;
    total?: number;
  }>;
  items: Array<{
    productName: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
  }>;
}

export async function sendPaymentReceipt(payload: SendPaymentReceiptInput): Promise<boolean> {
  const receiptEndpoint = process.env.EXPO_PUBLIC_PAYMENT_RECEIPT_URL;
  if (!receiptEndpoint) {
    console.warn('[Receipt] Payment receipt endpoint is not configured.');
    return false;
  }

  try {
    const response = await fetch(receiptEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.warn('[Receipt] Receipt email request failed', {
        status: response.status,
        statusText: response.statusText,
      });
      return false;
    }

    return true;
  } catch (error) {
    console.warn('[Receipt] Receipt email request errored', error);
    return false;
  }
}
