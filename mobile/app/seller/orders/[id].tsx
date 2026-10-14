import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CancelOrderSheet } from '@/components/orders/CancelOrderSheet';
import { DeliverySummary } from '@/components/orders/DeliverySummary';
import { OrderCancellationNotice } from '@/components/orders/OrderCancellationNotice';
import { OrderItemRows } from '@/components/orders/OrderItemRows';
import {
  OrderRefundSummary,
  getRefundStatusPresentation,
} from '@/components/orders/OrderRefundSummary';
import { OrderReturnSummary } from '@/components/orders/OrderReturnSummary';
import { formatRefundStatusSpeech } from '@/components/payment/paymentSpeech';
import { ReturnResponseSheet } from '@/components/seller/ReturnResponseSheet';
import { RefundResponseSheet } from '@/components/seller/RefundResponseSheet';
import { DeliveryUpdateSheet } from '@/components/seller/DeliveryUpdateSheet';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Callout } from '@/components/ui/Callout';
import { FormError } from '@/components/ui/FormError';
import { ReadAloudButton } from '@/components/ui/ReadAloudButton';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { TopBar } from '@/components/ui/TopBar';
import { useOrdersRefresh } from '@/hooks/useOrdersRefresh';
import { useReduceMotion } from '@/hooks/useReduceMotion';
import { useSellerChat } from '@/hooks/useSellerChat';
import { nextDeliveryStatusLabel } from '@/lib/deliveries';
import { formatDate } from '@/lib/i18n';
import {
  canSellerCancel,
  formatMoney,
  formatPlacedAt,
  latestReturn,
  statusPresentation,
} from '@/lib/orders';
import { useOrders } from '@/lib/OrdersProvider';
import { refundService } from '@/services/refund/refundService';
import type { RefundRequest } from '@/services/refund/refundTypes';

export default function SellerOrderDetailScreen() {
  const reduceMotion = useReduceMotion();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { getOrder, advanceDelivery, respondToReturn, refresh } = useOrders();
  const { openSellerChat, isOpening } = useSellerChat();
  useOrdersRefresh();

  const order = id ? getOrder(id) : undefined;
  const [isAdvancing, setIsAdvancing] = useState(false);
  const [isDeliveryOpen, setIsDeliveryOpen] = useState(false);
  const [isCancelOpen, setIsCancelOpen] = useState(false);
  const [returnDecision, setReturnDecision] = useState<'approved' | 'rejected' | null>(null);
  const [refundDecision, setRefundDecision] = useState<'approved' | 'rejected' | null>(null);
  const [isCompletingReturn, setIsCompletingReturn] = useState(false);
  const [returnError, setReturnError] = useState<string | null>(null);

  const [refunds, setRefunds] = useState<RefundRequest[]>(
    order ? refundService.getRefundsForOrder(order.id) : []
  );

  useEffect(() => {
    if (order?.id) {
      void refundService
        .fetchRefundsForOrder(order.id, order.order_number)
        .then((loaded) => {
          if (loaded.length > 0) {
            setRefunds(loaded);
          }
        });
    }
  }, [order?.id, order?.order_number]);

  if (!order) {
    return (
      <View className="flex-1 bg-surface">
        <TopBar title={t('orders.order')} />
        <View className="items-center gap-3 p-4 pt-16">
          <Text role="heading" className="type-h3 text-primary">
            {t('orders.notFound')}
          </Text>
          <Text className="type-text-primary text-center text-secondary">
            {t('seller.orderDetail.unavailable')}
          </Text>
          <Button
            variant="secondary"
            label={t('orders.backToOrders')}
            fullWidth={false}
            onPress={() => router.replace('/(seller)/orders')}
          />
        </View>
      </View>
    );
  }

  const presentation = statusPresentation(order.status);
  const isCancelled = order.status === 'cancelled';
  const orderReturn = latestReturn(order);
  const itemsTotal = order.items.reduce(
    (sum, item) => sum + item.unit_price * item.quantity,
    0
  );

  const latestRefund =
    refunds.length > 0
      ? refunds[refunds.length - 1]
      : refundService.getRefund(order.id);

  const activeRefund: RefundRequest | undefined =
    latestRefund ??
    (order.payment_status === 'refunded' || order.payment_status === 'partially_refunded'
      ? {
          id: `REF-${order.order_number}`,
          orderId: order.id,
          orderNumber: order.order_number,
          paymentReference: order.payment_reference ?? `ORDER-${order.order_number}`,
          paymentMethod: order.payment_method ?? 'PayHere',
          totalOrderAmount: order.total || itemsTotal,
          refundAmount: order.total || itemsTotal,
          refundType: order.payment_status === 'partially_refunded' ? 'partial' : 'full',
          reason: 'other',
          reasonLabel: t('refund.orderRefundedLabel', { defaultValue: 'Order Refunded' }),
          status: 'refunded',
          createdAt: order.updated_at || order.created_at || new Date().toISOString(),
          currency: 'LKR',
        }
      : undefined);

  const isRefunded =
    order.payment_status === 'refunded' || activeRefund?.status === 'refunded';

  const advanceLabel = isRefunded
    ? null
    : nextDeliveryStatusLabel(order.delivery?.status ?? 'pending');

  async function advance() {
    setIsAdvancing(true);
    await advanceDelivery(order!.id);
    setIsAdvancing(false);
  }

  async function completeReturn() {
    if (!orderReturn) return;

    setReturnError(null);
    setIsCompletingReturn(true);
    const { error } = await respondToReturn({ returnId: orderReturn.id, decision: 'complete' });
    setIsCompletingReturn(false);

    if (error) setReturnError(t('returns.respondError'));
  }

  return (
    <View className="flex-1 bg-surface">
      <TopBar title={t('orders.orderNumber', { number: order.order_number })} />

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 32, gap: 24 }}>
        <View className="gap-2">
          <View className="flex-row flex-wrap items-center gap-2">
            <Badge label={presentation.label} variant={presentation.variant} />
            {activeRefund ? (
              <Badge
                label={getRefundStatusPresentation(activeRefund.status).label}
                variant={getRefundStatusPresentation(activeRefund.status).variant}
              />
            ) : null}
          </View>
          <Text className="type-h2 text-primary">{order.ship_name ?? t('account.seller.buyer')}</Text>
          <Text className="type-text-secondary text-secondary">
            {t('orders.placed', { date: formatPlacedAt(order.placed_at) })}
          </Text>
        </View>

        {activeRefund?.status === 'requested' || activeRefund?.status === 'processing' ? (
          <Callout
            tone="warning"
            message={t('seller.orderDetail.refundProcessingWarning', {
              defaultValue:
                'Buyer has requested a refund for this order. Review refund details below before dispatching or fulfilling delivery.',
            })}
          />
        ) : isRefunded ? (
          <Callout
            tone="info"
            message={t('seller.orderDetail.refundCompletedInfo', {
              defaultValue: 'This order has been refunded. Delivery progression has been stopped.',
            })}
          />
        ) : activeRefund?.status === 'failed' ? (
          <Callout
            tone="warning"
            message={t('seller.orderDetail.refundFailedWarning', {
              defaultValue: 'A previous refund request for this order failed to process.',
            })}
          />
        ) : null}

        <View className="gap-4">
          <SectionHeader title={t('orders.items')} />

          <OrderItemRows items={order.items} />

          <View className="flex-row items-center justify-between gap-3 px-4">
            <Text className="type-label-lg text-primary">{t('cart.total')}</Text>
            <Text className="type-label-lg text-primary">{formatMoney(itemsTotal)}</Text>
          </View>
        </View>

        {orderReturn ? (
          <OrderReturnSummary orderReturn={orderReturn} viewer="seller">
            {orderReturn.status === 'requested' ? (
              <View className="flex-row gap-3">
                <View className="flex-1">
                  <Button
                    size="sm"
                    label={t('returns.approve')}
                    hint={t('returns.approveHint')}
                    onPress={() => setReturnDecision('approved')}
                  />
                </View>
                <View className="flex-1">
                  <Button
                    variant="secondary"
                    size="sm"
                    label={t('returns.reject')}
                    hint={t('returns.rejectHint')}
                    onPress={() => setReturnDecision('rejected')}
                  />
                </View>
              </View>
            ) : orderReturn.status === 'approved' ? (
              <>
                <FormError message={returnError} />
                <Button
                  size="sm"
                  label={t('returns.markReceived')}
                  hint={t('returns.markReceivedHint')}
                  loading={isCompletingReturn}
                  onPress={completeReturn}
                />
              </>
            ) : null}
          </OrderReturnSummary>
        ) : null}

        {activeRefund ? (
          <OrderRefundSummary refund={activeRefund} viewer="seller">
            {activeRefund.status === 'requested' || activeRefund.status === 'processing' ? (
              <View className="pt-2 gap-3">
                <View className="flex-row gap-3">
                  <View className="flex-1">
                    <Button
                      size="sm"
                      label={t('refund.approve', { defaultValue: 'Approve Refund' })}
                      hint="Opens the sheet to approve this refund request"
                      onPress={() => setRefundDecision('approved')}
                    />
                  </View>
                  <View className="flex-1">
                    <Button
                      variant="secondary"
                      size="sm"
                      label={t('refund.reject', { defaultValue: 'Decline Refund' })}
                      hint="Opens the sheet to decline this refund request"
                      onPress={() => setRefundDecision('rejected')}
                    />
                  </View>
                </View>

                <ReadAloudButton
                  text={formatRefundStatusSpeech({
                    status: activeRefund.status,
                    amount: activeRefund.refundAmount,
                    currency: activeRefund.currency || 'LKR',
                    refundReference: activeRefund.id,
                    reason: activeRefund.reasonLabel,
                  })}
                  label={t('refund.readAloud', { defaultValue: 'Read aloud refund details' })}
                />
              </View>
            ) : (
              <View className="pt-2 gap-2">
                <ReadAloudButton
                  text={formatRefundStatusSpeech({
                    status: activeRefund.status,
                    amount: activeRefund.refundAmount,
                    currency: activeRefund.currency || 'LKR',
                    refundReference: activeRefund.id,
                    reason: activeRefund.reasonLabel,
                  })}
                  label={t('refund.readAloud', { defaultValue: 'Read aloud refund details' })}
                />
              </View>
            )}
          </OrderRefundSummary>
        ) : null}

        {refunds.length > 1 ? (
          <View className="gap-3">
            <SectionHeader title={t('refund.history', { defaultValue: 'Refund history' })} />
            <View className="gap-2">
              {refunds.map((record, index) => {
                const isLatest = index === refunds.length - 1;
                const recPresentation = getRefundStatusPresentation(record.status);

                return (
                  <View
                    key={record.id}
                    accessibilityRole="summary"
                    aria-label={`Refund ${record.id}, ${formatMoney(record.refundAmount)}, ${recPresentation.label}`}
                    className="rounded-12 border-1 border-border bg-surface p-3 gap-2">
                    <View className="flex-row items-center justify-between">
                      <View className="flex-row items-center gap-2">
                        <Text className="type-mono text-secondary font-bold">
                          {record.id}
                        </Text>
                        {isLatest ? (
                          <Text className="type-overline text-secondary font-bold">
                            ({t('refund.latest', { defaultValue: 'Latest' })})
                          </Text>
                        ) : null}
                      </View>
                      <Badge label={recPresentation.label} variant={recPresentation.variant} />
                    </View>

                    <View className="flex-row items-baseline justify-between">
                      <Text className="type-text-secondary text-secondary" numberOfLines={1}>
                        {record.reasonLabel}
                      </Text>
                      <Text className="type-label-lg text-primary">
                        {formatMoney(record.refundAmount)}
                      </Text>
                    </View>

                    <Text className="type-text-secondary text-secondary text-xs">
                      {formatDate(record.createdAt, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        ) : null}

        {isCancelled ? (
          <OrderCancellationNotice order={order} viewer="seller" />
        ) : isRefunded ? (
          <>
            <DeliverySummary
              delivery={order.delivery}
              onEdit={() => setIsDeliveryOpen(true)}
            />
            <Text className="type-text-secondary text-center text-secondary">
              {t('seller.orderDetail.refundedDeliveryNote', {
                defaultValue: 'Order refunded. Delivery actions disabled.',
              })}
            </Text>
          </>
        ) : (
          <>
            <DeliverySummary
              delivery={order.delivery}
              onEdit={() => setIsDeliveryOpen(true)}
            />

            {advanceLabel ? (
              <Button label={advanceLabel} loading={isAdvancing} onPress={advance} />
            ) : (
              <Text className="type-text-secondary text-center text-secondary">
                {t('seller.orderDetail.complete')}
              </Text>
            )}
          </>
        )}

        {order.shop_id ? (
          <Button
            variant="secondary"
            label={t('seller.orderDetail.messageBuyer')}
            hint={t('seller.orderDetail.messageBuyerHint')}
            loading={isOpening}
            onPress={() =>
              order.shop_id &&
              openSellerChat({ shopId: order.shop_id, buyerId: order.buyer_id, orderId: order.id })
            }
          />
        ) : null}

        {canSellerCancel(order) ? (
          <Button
            variant="destructive"
            label={t('orders.cancel.action')}
            hint={t('orders.cancel.sellerHint')}
            onPress={() => setIsCancelOpen(true)}
          />
        ) : null}
      </ScrollView>

      <Modal
        visible={isDeliveryOpen}
        transparent
        animationType={reduceMotion ? 'none' : 'fade'}
        onRequestClose={() => setIsDeliveryOpen(false)}>
        <DeliveryUpdateSheet
          orderId={order.id}
          delivery={order.delivery}
          onDismiss={() => setIsDeliveryOpen(false)}
        />
      </Modal>

      <Modal
        visible={returnDecision !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setReturnDecision(null)}>
        {orderReturn && returnDecision ? (
          <ReturnResponseSheet
            returnId={orderReturn.id}
            decision={returnDecision}
            onDismiss={() => setReturnDecision(null)}
          />
        ) : null}
      </Modal>

      <Modal
        visible={refundDecision !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setRefundDecision(null)}>
        {activeRefund && refundDecision ? (
          <RefundResponseSheet
            orderId={order.id}
            refundId={activeRefund.id}
            refundAmount={activeRefund.refundAmount}
            orderNumber={order.order_number}
            decision={refundDecision}
            onDismiss={() => setRefundDecision(null)}
            onSuccess={() => {
              setRefundDecision(null);
              void refundService
                .fetchRefundsForOrder(order.id, order.order_number)
                .then((loaded) => {
                  setRefunds(loaded);
                });
              void refresh();
            }}
          />
        ) : null}
      </Modal>

      <Modal
        visible={isCancelOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsCancelOpen(false)}>
        <CancelOrderSheet
          orderId={order.id}
          isSeller
          onDismiss={() => setIsCancelOpen(false)}
        />
      </Modal>
    </View>
  );
}
