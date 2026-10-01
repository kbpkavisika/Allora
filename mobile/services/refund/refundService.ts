import type { CreateRefundInput, RefundOutcome, RefundRequest, RefundStatus } from './refundTypes';
import { REFUND_REASONS } from './refundTypes';

// In-memory session store for refund requests
const refundStore = new Map<string, RefundRequest>();

export class RefundService {
  async requestRefund(input: CreateRefundInput): Promise<RefundOutcome> {
    // Simulate brief network processing for realistic asynchronous UX
    await new Promise((resolve) => setTimeout(resolve, 500));

    if (!input.orderId) {
      return { success: false, error: 'Order ID is required.' };
    }

    if (!input.refundAmount || input.refundAmount <= 0) {
      return { success: false, error: 'Refund amount must be greater than zero.' };
    }

    if (input.refundAmount > input.totalOrderAmount) {
      return { success: false, error: 'Refund amount cannot exceed the order total.' };
    }

    const reasonObj = REFUND_REASONS.find((r) => r.value === input.reason);
    const reasonLabel = reasonObj?.label ?? 'Other';

    const refundId = `REF-${Math.floor(100000 + Math.random() * 900000)}`;

    const newRefund: RefundRequest = {
      id: refundId,
      orderId: input.orderId,
      orderNumber: input.orderNumber,
      paymentReference: input.paymentReference || input.orderNumber,
      paymentMethod: input.paymentMethod || 'PayHere',
      totalOrderAmount: input.totalOrderAmount,
      refundAmount: input.refundAmount,
      refundType: input.refundType,
      reason: input.reason,
      reasonLabel,
      reasonDetails: input.reasonDetails?.trim() || undefined,
      status: 'processing',
      createdAt: new Date().toISOString(),
      currency: input.currency ?? 'LKR',
    };

    refundStore.set(input.orderId, newRefund);
    return { success: true, refund: newRefund };
  }

  getRefund(orderId: string): RefundRequest | undefined {
    return refundStore.get(orderId);
  }

  getRefunds(): RefundRequest[] {
    return Array.from(refundStore.values());
  }

  updateRefundStatus(orderId: string, status: RefundStatus): RefundRequest | undefined {
    const existing = refundStore.get(orderId);
    if (!existing) return undefined;
    const updated = { ...existing, status };
    refundStore.set(orderId, updated);
    return updated;
  }
}

export const refundService = new RefundService();
