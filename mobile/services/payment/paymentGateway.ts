import type { PaymentRequest, PaymentResult } from './paymentTypes';

export interface PaymentGateway {
  startPayment(request: PaymentRequest): Promise<PaymentResult>;
}
