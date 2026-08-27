import type { PaymentGateway } from './paymentGateway';
import type { PaymentRequest, PaymentResult, PaymentState } from './paymentTypes';

type MockResultState = Exclude<PaymentState, 'idle' | 'processing'>;

export interface MockPaymentGatewayOptions {
  result?: MockResultState;
  delayMs?: number;
}

const DEFAULT_RESULT: MockResultState = 'success';

export class MockPaymentGateway implements PaymentGateway {
  private readonly result: MockResultState;
  private readonly delayMs: number;

  constructor({ result = DEFAULT_RESULT, delayMs = 450 }: MockPaymentGatewayOptions = {}) {
    this.result = result;
    this.delayMs = delayMs;
  }

  async startPayment(request: PaymentRequest): Promise<PaymentResult> {
    await new Promise((resolve) => setTimeout(resolve, this.delayMs));

    const messages: Record<MockResultState, string> = {
      authentication_required: 'Additional payment authentication is required.',
      success: 'Mock payment completed successfully.',
      failed: 'Mock payment failed. Please try again.',
      cancelled: 'Mock payment was cancelled.',
      pending: 'Mock payment is still being processed.',
    };

    return {
      state: this.result,
      reference: `MOCK-${request.orderId}-${Date.now()}`,
      message: messages[this.result],
    };
  }
}
