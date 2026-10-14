import { supabase } from '@/lib/supabase';
import type { CreateRefundInput, RefundOutcome, RefundRequest, RefundStatus } from './refundTypes';
import { REFUND_REASONS } from './refundTypes';

const refundStore = new Map<string, RefundRequest[]>();

interface OrderRefundRow {
  id: string;
  refund_number: string;
  order_id: string;
  buyer_id: string;
  amount: number | string;
  refund_type: 'full' | 'partial';
  reason: RefundRequest['reason'];
  reason_label: string | null;
  details: string | null;
  status: RefundStatus;
  payment_reference: string | null;
  currency: string | null;
  created_at: string;
}

function mapRowToRefundRequest(row: OrderRefundRow, fallbackOrderNumber = ''): RefundRequest {
  const reasonObj = REFUND_REASONS.find((r) => r.value === row.reason);
  const reasonLabel = row.reason_label || reasonObj?.label || 'Other';

  return {
    id: row.refund_number || row.id,
    orderId: row.order_id,
    orderNumber: fallbackOrderNumber || row.order_id,
    paymentReference: row.payment_reference || '',
    paymentMethod: 'PayHere',
    totalOrderAmount: Number(row.amount),
    refundAmount: Number(row.amount),
    refundType: row.refund_type,
    reason: row.reason,
    reasonLabel,
    reasonDetails: row.details || undefined,
    status: row.status,
    createdAt: row.created_at,
    currency: row.currency || 'LKR',
  };
}

export class RefundService {
  async requestRefund(input: CreateRefundInput): Promise<RefundOutcome> {
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

    let persistedId: string | null = null;
    let persistedCreatedAt: string | null = null;

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const buyerId = session?.user.id;

      if (buyerId) {
        const { data, error } = await supabase
          .from('order_refunds')
          .insert({
            order_id: input.orderId,
            buyer_id: buyerId,
            amount: input.refundAmount,
            refund_type: input.refundType,
            reason: input.reason,
            reason_label: reasonLabel,
            details: input.reasonDetails?.trim() || null,
            payment_reference: input.paymentReference || null,
            currency: input.currency ?? 'LKR',
            status: 'processing',
          })
          .select('id, refund_number, created_at, status')
          .single();

        if (!error && data) {
          persistedId = data.refund_number || data.id;
          persistedCreatedAt = data.created_at;
        }
      }
    } catch {
      persistedId = null;
    }

    const refundId = persistedId ?? `REF-${Math.floor(100000 + Math.random() * 900000)}`;

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
      createdAt: persistedCreatedAt ?? new Date().toISOString(),
      currency: input.currency ?? 'LKR',
    };

    const existing = refundStore.get(input.orderId) ?? [];
    refundStore.set(input.orderId, [...existing, newRefund]);
    return { success: true, refund: newRefund };
  }

  async fetchRefundsForOrder(orderId: string, orderNumber = ''): Promise<RefundRequest[]> {
    try {
      const { data, error } = await supabase
        .from('order_refunds')
        .select('*')
        .eq('order_id', orderId)
        .order('created_at', { ascending: true });

      if (!error && Array.isArray(data) && data.length > 0) {
        const mapped = (data as unknown as OrderRefundRow[]).map((row) =>
          mapRowToRefundRequest(row, orderNumber)
        );
        refundStore.set(orderId, mapped);
        return mapped;
      }
    } catch {
      // Return cached list if Supabase query fails
    }

    return refundStore.get(orderId) ?? [];
  }

  async fetchRefundsForOrders(orderIds: string[]): Promise<Map<string, RefundRequest[]>> {
    if (orderIds.length === 0) return refundStore;

    try {
      const { data, error } = await supabase
        .from('order_refunds')
        .select('*')
        .in('order_id', orderIds)
        .order('created_at', { ascending: true });

      if (!error && Array.isArray(data) && data.length > 0) {
        for (const row of data as unknown as OrderRefundRow[]) {
          const mapped = mapRowToRefundRequest(row);
          const existing = refundStore.get(row.order_id) ?? [];
          if (!existing.some((r) => r.id === mapped.id)) {
            refundStore.set(row.order_id, [...existing, mapped]);
          }
        }
      }
    } catch {
      // Return cached store if query fails
    }

    return refundStore;
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
    let matchedRefund: RefundRequest | undefined;

    if (list && list.length > 0) {
      const latest = list[list.length - 1];
      latest.status = status;
      matchedRefund = latest;
    } else {
      for (const refunds of refundStore.values()) {
        const match = refunds.find((r) => r.id === idOrOrderId);
        if (match) {
          match.status = status;
          matchedRefund = match;
          break;
        }
      }
    }

    if (matchedRefund) {
      const targetOrderId = matchedRefund.orderId;
      const refNumber = matchedRefund.id;

      void (async () => {
        try {
          await supabase
            .from('order_refunds')
            .update({ status })
            .or(`refund_number.eq.${refNumber},order_id.eq.${targetOrderId}`);

          if (status === 'refunded') {
            const isPartial = matchedRefund.refundType === 'partial';
            await supabase
              .from('orders')
              .update({
                payment_status: isPartial ? 'partially_refunded' : 'refunded',
              })
              .eq('id', targetOrderId);
          }
        } catch {
          // Status kept in local memory
        }
      })();
    }

    return matchedRefund;
  }
}

export const refundService = new RefundService();
