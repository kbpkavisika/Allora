export type PaymentState =
  | 'idle'
  | 'processing'
  | 'authentication_required'
  | 'success'
  | 'failed'
  | 'cancelled'
  | 'pending';

export type PaymentMethod = 'mock';

export interface PaymentRequest {
  amount: number;
  currency: string;
  orderId: string;
  description?: string;
}

export interface PaymentResult {
  state: Exclude<PaymentState, 'idle' | 'processing'>;
  reference: string;
  message: string;
}
