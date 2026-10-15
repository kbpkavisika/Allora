import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CancelOrderSheet } from '@/components/orders/CancelOrderSheet';
import { DeliverySummary } from '@/components/orders/DeliverySummary';
import { OrderCancellationNotice } from '@/components/orders/OrderCancellationNotice';
import { OrderItemRows } from '@/components/orders/OrderItemRows';
import { OrderRefundSummary } from '@/components/orders/OrderRefundSummary';
import { OrderReturnSummary } from '@/components/orders/OrderReturnSummary';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Callout } from '@/components/ui/Callout';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { StepProgress } from '@/components/ui/StepProgress';
import { SuccessBanner } from '@/components/ui/SuccessBanner';
import { TopBar } from '@/components/ui/TopBar';
import { useOrdersRefresh } from '@/hooks/useOrdersRefresh';
import { useSellerChat } from '@/hooks/useSellerChat';
import { useAuth } from '@/lib/AuthProvider';
import { deliveryTrackingStep } from '@/lib/deliveries';
import {
  canBuyerCancel,
  canRequestReturn,
  formatMoney,
  latestReturn,
  statusPresentation,
} from '@/lib/orders';
import { formatDate } from '@/lib/i18n';
import { useOrders } from '@/lib/OrdersProvider';
import { refundService } from '@/services/refund/refundService';

export default function OrderDetailScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { session } = useAuth();
  const { id, returned } = useLocalSearchParams<{ id?: string; returned?: string }>();
  const { getOrder, isLoading } = useOrders();
  const { openSellerChat, isOpening } = useSellerChat();
  useOrdersRefresh();

  const order = id ? getOrder(id) : undefined;
  const [isCancelOpen, setIsCancelOpen] = useState(false);
  const [refunds, setRefunds] = useState(order ? refundService.getRefundsForOrder(order.id) : []);
  const refund = refunds.length > 0 ? refunds[refunds.length - 1] : undefined;

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
            {isLoading ? t('orders.loading') : t('orders.notFound')}
          </Text>
          {!isLoading ? (
            <Button
              variant="secondary"
              label={t('orders.backToOrders')}
              fullWidth={false}
              onPress={() => router.replace('/(tabs)/orders')}
            />
          ) : null}
        </View>
      </View>
    );
  }

  const presentation = statusPresentation(order.status);
  const isCancelled = order.status === 'cancelled';
  const orderReturn = latestReturn(order);
  const step = deliveryTrackingStep(order.delivery);
  const total = order.items.reduce((sum, item) => sum + item.unit_price * item.quantity, 0);
  const orderTotal = order.total || total;

  const isEligibleForRefund =
    order.payment_method === 'payhere' && order.payment_status === 'paid';

  const canRequestRefund = isEligibleForRefund && (!refund || refund.status === 'failed');

  let paymentBadgeLabel = 'Pending';
  let paymentBadgeVariant: 'success' | 'warning' | 'neutral' | 'dark' = 'neutral';

  if (order.payment_status === 'refunded' || refund?.status === 'refunded') {
    paymentBadgeLabel = 'Refund Completed';
    paymentBadgeVariant = 'success';
  } else if (order.payment_status === 'partially_refunded') {
    paymentBadgeLabel = 'Partially Refunded';
    paymentBadgeVariant = 'neutral';
  } else if (refund?.status === 'requested') {
    paymentBadgeLabel = 'Refund Requested';
    paymentBadgeVariant = 'neutral';
  } else if (refund?.status === 'processing') {
    paymentBadgeLabel = 'Refund Processing';
    paymentBadgeVariant = 'neutral';
  } else if (order.payment_status === 'failed') {
    paymentBadgeLabel = 'Failed';
    paymentBadgeVariant = 'warning';
  } else if (order.payment_status === 'paid') {
    paymentBadgeLabel = 'Paid';
    paymentBadgeVariant = 'success';
  } else if (order.payment_method === 'cod') {
    paymentBadgeLabel = 'Due on Delivery';
    paymentBadgeVariant = 'neutral';
  }

  const paymentMethodDisplay =
    order.payment_method === 'payhere'
      ? 'PayHere (Online Payment)'
      : order.payment_method === 'cod'
        ? 'Cash on Delivery'
        : order.payment_method || 'PayHere';

  const receiptIndication =
    order.payment_method === 'cod'
      ? 'Receipt provided upon cash payment at delivery.'
      : session?.user?.email
        ? `Payment receipt delivered to ${session.user.email}.`
        : 'Payment receipt delivered to registered email address.';

  return (
    <View className="flex-1 bg-surface">
      <TopBar title={`Order ${order.order_number}`} />

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 32, gap: 24 }}
        showsVerticalScrollIndicator={false}>
        {returned ? (
          <SuccessBanner message={t('orders.returnSent')} />
        ) : null}

        <View className="gap-2">
          <Badge label={presentation.label} variant={presentation.variant} />
          <Text role="heading" className="type-h2 text-primary">
            {order.items[0]?.product_name ?? t('orders.order')}
          </Text>
          <Text className="type-text-secondary text-secondary">
            {t('orders.placed', {
              date: formatDate(order.placed_at, { day: 'numeric', month: 'short', year: 'numeric' }),
            })}
          </Text>
        </View>

        {isCancelled ? (
          <OrderCancellationNotice order={order} viewer="buyer" />
        ) : (
          <>
            <View className="gap-4">
              <SectionHeader title={t('orders.tracking')} />
              <StepProgress current={step.current} total={step.total} />
              <Text className="type-text-secondary text-secondary">
                {t('orders.step', { current: step.current, total: step.total, label: step.label })}
              </Text>
            </View>

            <DeliverySummary delivery={order.delivery} />
          </>
        )}

        <View className="gap-4">
          <SectionHeader title={t('orders.items')} />
          <OrderItemRows items={order.items} />
          <View className="flex-row items-center justify-between px-1">
            <Text className="type-label-lg text-primary">{t('cart.total')}</Text>
            <Text className="type-label-lg text-primary">{formatMoney(orderTotal)}</Text>
          </View>
        </View>

        {/* Payment Information Section */}
        <View className="gap-4">
          <SectionHeader title="Payment information" />
          <View
            accessibilityRole="summary"
            aria-label="Payment information"
            className="gap-3 rounded-12 border-1 border-border bg-surface p-4">
            <View className="flex-row items-center justify-between">
              <Text className="type-label text-secondary" maxFontSizeMultiplier={2}>
                Order Reference
              </Text>
              <Text className="type-mono text-primary" maxFontSizeMultiplier={2}>
                #{order.order_number}
              </Text>
            </View>

            <View className="flex-row items-center justify-between">
              <Text className="type-label text-secondary" maxFontSizeMultiplier={2}>
                Payment Status
              </Text>
              <Badge label={paymentBadgeLabel} variant={paymentBadgeVariant} />
            </View>

            <View className="flex-row items-center justify-between">
              <Text className="type-label text-secondary" maxFontSizeMultiplier={2}>
                Payment Method
              </Text>
              <Text className="type-text-primary text-primary" maxFontSizeMultiplier={2}>
                {paymentMethodDisplay}
              </Text>
            </View>

            <View className="flex-row items-center justify-between">
              <Text className="type-label text-secondary" maxFontSizeMultiplier={2}>
                Amount Paid
              </Text>
              <Text className="type-h3 text-primary" maxFontSizeMultiplier={2}>
                {formatMoney(orderTotal)}
              </Text>
            </View>

            <View className="flex-row items-center justify-between">
              <Text className="type-label text-secondary" maxFontSizeMultiplier={2}>
                Currency
              </Text>
              <Text className="type-mono text-primary" maxFontSizeMultiplier={2}>
                LKR
              </Text>
            </View>

            {order.payment_reference ? (
              <View className="flex-row items-center justify-between">
                <Text className="type-label text-secondary" maxFontSizeMultiplier={2}>
                  Payment Reference
                </Text>
                <Text className="type-mono text-primary" maxFontSizeMultiplier={2}>
                  {order.payment_reference}
                </Text>
              </View>
            ) : null}

            {receiptIndication ? (
              <View className="border-t-1 border-border pt-2">
                <Text className="type-text-secondary text-secondary" maxFontSizeMultiplier={2}>
                  {receiptIndication}
                </Text>
              </View>
            ) : null}

          </View>
        </View>

        {/* Refund Information Section */}
        {refund ? (
          <OrderRefundSummary refund={refund} viewer="buyer">
            <View className="pt-2 gap-2">
              <Button
                variant="secondary"
                size="sm"
                label={t('refund.viewStatus', { defaultValue: 'View refund status' })}
                hint={t('refund.viewStatusHint', {
                  defaultValue: 'Navigates to the refund status tracking screen',
                })}
                onPress={() =>
                  router.push({
                    pathname: '/orders/[id]/refund-status' as any,
                    params: { id: order.id },
                  })
                }
              />
            </View>
          </OrderRefundSummary>
        ) : null}

        {/* Refund History Section (if multiple refund records exist) */}
        {refunds.length > 1 ? (
          <View className="gap-3">
            <SectionHeader title={t('refund.history', { defaultValue: 'Refund history' })} />
            <View className="gap-2">
              {refunds.map((record, index) => {
                const isLatest = index === refunds.length - 1;
                const recStatus =
                  record.status === 'refunded'
                    ? 'Refund Completed'
                    : record.status === 'failed'
                      ? 'Refund Declined'
                      : record.status === 'requested'
                        ? 'Refund Requested'
                        : 'Refund Processing';
                const recVariant: 'success' | 'warning' | 'neutral' =
                  record.status === 'refunded'
                    ? 'success'
                    : record.status === 'failed'
                      ? 'warning'
                      : 'neutral';

                return (
                  <View
                    key={record.id}
                    accessibilityRole="summary"
                    aria-label={`Refund ${record.id}, ${formatMoney(record.refundAmount)}, ${recStatus}`}
                    className="rounded-12 border-1 border-border bg-surface p-3 gap-2">
                    <View className="flex-row items-center justify-between">
                      <View className="flex-row items-center gap-2">
                        <Text className="type-mono text-secondary font-bold">
                          {record.id}
                        </Text>
                        {isLatest ? (
                          <Text className="type-overline text-secondary font-bold">
                            (Latest)
                          </Text>
                        ) : null}
                      </View>
                      <Badge label={recStatus} variant={recVariant} />
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
                      {new Date(record.createdAt).toLocaleString('en-US', {
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

        {orderReturn ? <OrderReturnSummary orderReturn={orderReturn} viewer="buyer" /> : null}

        <Callout message={t('orders.alertCallout')} />

        <View className="gap-3">
          {canBuyerCancel(order) ? (
            <Button
              variant="destructive"
              size="md"
              label={t('orders.cancel.action')}
              hint={t('orders.cancel.buyerHint')}
              onPress={() => setIsCancelOpen(true)}
            />
          ) : order.status === 'new' ? (
            <Callout message={t('orders.cancel.paidUseRefund')} />
          ) : null}

          {canRequestRefund ? (
            <Button
              variant="secondary"
              size="md"
              label={refund?.status === 'failed' ? 'Retry refund request' : 'Request refund'}
              hint="Opens the refund request form for this order"
              onPress={() =>
                router.push({ pathname: '/orders/[id]/refund' as any, params: { id: order.id } })
              }
            />
          ) : null}

          <View className="flex-row gap-3">
            {canRequestReturn(order) ? (
              <View className="flex-1">
                <Button
                  variant="secondary"
                  size="sm"
                  label={t('orders.returnItem')}
                  onPress={() =>
                    router.push({ pathname: '/orders/[id]/return', params: { id: order.id } })
                  }
                />
              </View>
            ) : null}
            <View className="flex-1">
              <Button
                variant="secondary"
                size="sm"
                label={t('orders.chatWithSeller')}
                loading={isOpening}
                disabled={!order.shop_id}
                hint={t('orders.chatWithSellerHint')}
                onPress={() =>
                  order.shop_id && openSellerChat({ shopId: order.shop_id, orderId: order.id })
                }
              />
            </View>
          </View>
        </View>
      </ScrollView>

      <Modal
        visible={isCancelOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsCancelOpen(false)}>
        <CancelOrderSheet
          orderId={order.id}
          isSeller={false}
          onDismiss={() => setIsCancelOpen(false)}
        />
      </Modal>
    </View>
  );
}
