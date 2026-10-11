import type { CreateRefundInput, RefundOutcome, RefundRequest, RefundStatus } from './refundTypes';
import { REFUND_REASONS } from './refundTypes';

// In-memory session store for refund requests per order
const refundStore = new Map<string, RefundRequest[]>();

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

    const existing = refundStore.get(input.orderId) ?? [];
    refundStore.set(input.orderId, [...existing, newRefund]);
    return { success: true, refund: newRefund };
  }

  getRefund(idOrOrderId: string): RefundRequest | undefined {
    const list = refundStore.get(idOrOrderId);
    if (list && list.length > 0) {
      return list[list.length - 1];
    }
    for (const refunds of refundStore.values()) {
      const match = refunds.find((r) => r.id === idOrOrderId);
      if (match) return match;
    }
    return undefined;
  }

  getRefundsForOrder(orderId: string): RefundRequest[] {
    return refundStore.get(orderId) ?? [];
  }

  getRefunds(): RefundRequest[] {
    const all: RefundRequest[] = [];
    for (const list of refundStore.values()) {
      all.push(...list);
    }
    return all;
  }

  updateRefundStatus(idOrOrderId: string, status: RefundStatus): RefundRequest | undefined {
    const list = refundStore.get(idOrOrderId);
    if (list && list.length > 0) {
      const latest = list[list.length - 1];
      latest.status = status;
      return latest;
    }
    for (const refunds of refundStore.values()) {
      const match = refunds.find((r) => r.id === idOrOrderId);
      if (match) {
        match.status = status;
        return match;
      }
    }
    return undefined;
  }
}

export const refundService = new RefundService();
