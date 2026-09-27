export interface PaymentReceiptOrderSummary {
  id?: string;
  order_number?: string;
  total?: number;
}

export interface PaymentReceiptItem {
  productName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface PaymentReceiptPayload {
  buyerEmail: string;
  buyerName: string;
  paymentId: string;
  payHereOrderId: string;
  amount: number;
  currency: string;
  paymentMethod: 'payhere';
  paymentDate: string;
  orders: PaymentReceiptOrderSummary[];
  items: PaymentReceiptItem[];
}

export interface BuildPaymentReceiptInput {
  buyerEmail: string;
  buyerName: string;
  paymentId: string;
  payHereOrderId: string;
  amount: number;
  currency: string;
  paymentMethod: 'payhere';
  paymentDate?: string;
  orders?: Array<{
    id?: string;
    order_number?: string;
    total?: number;
  }>;
  items?: Array<{
    productName: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
  }>;
}

export function buildPaymentReceiptPayload({
  buyerEmail,
  buyerName,
  paymentId,
  payHereOrderId,
  amount,
  currency,
  paymentMethod,
  paymentDate,
  orders = [],
  items = [],
}: BuildPaymentReceiptInput): PaymentReceiptPayload {
  return {
    buyerEmail,
    buyerName,
    paymentId,
    payHereOrderId,
    amount,
    currency,
    paymentMethod,
    paymentDate: paymentDate ?? new Date().toISOString(),
    orders,
    items,
  };
}
