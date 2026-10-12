export type RefundReason =
  | 'damaged'
  | 'wrong_item'
  | 'not_received'
  | 'not_as_described'
  | 'not_needed'
  | 'other';

export const REFUND_REASONS: readonly { value: RefundReason; label: string }[] = [
  { value: 'damaged', label: 'Product was damaged' },
  { value: 'wrong_item', label: 'Wrong item received' },
  { value: 'not_received', label: 'Item was not received' },
  { value: 'not_as_described', label: 'Product was different from description' },
  { value: 'not_needed', label: 'I no longer need the item' },
  { value: 'other', label: 'Other' },
];

export type RefundStatus = 'requested' | 'processing' | 'refunded' | 'failed';

export interface RefundRequest {
  id: string;
  orderId: string;
  orderNumber: string;
  paymentReference: string;
  paymentMethod: string;
  totalOrderAmount: number;
  refundAmount: number;
  refundType: 'full' | 'partial';
  reason: RefundReason;
  reasonLabel: string;
  reasonDetails?: string;
  status: RefundStatus;
  createdAt: string;
  currency: string;
  errorMessage?: string;
}

export interface CreateRefundInput {
  orderId: string;
  orderNumber: string;
  paymentReference: string;
  paymentMethod: string;
  totalOrderAmount: number;
  refundAmount: number;
  refundType: 'full' | 'partial';
  reason: RefundReason;
  reasonDetails?: string;
  currency?: string;
}

export interface RefundOutcome {
  success: boolean;
  refund?: RefundRequest;
  error?: string;
}
