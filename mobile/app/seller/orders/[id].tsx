import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CancelOrderSheet } from '@/components/orders/CancelOrderSheet';
import { DeliverySummary } from '@/components/orders/DeliverySummary';
import { OrderCancellationNotice } from '@/components/orders/OrderCancellationNotice';
import { OrderItemRows } from '@/components/orders/OrderItemRows';
import { OrderReturnSummary } from '@/components/orders/OrderReturnSummary';
import { ReturnResponseSheet } from '@/components/seller/ReturnResponseSheet';
import { FormError } from '@/components/ui/FormError';
import { useOrdersRefresh } from '@/hooks/useOrdersRefresh';
import { useSellerChat } from '@/hooks/useSellerChat';
import { DeliveryUpdateSheet } from '@/components/seller/DeliveryUpdateSheet';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { TopBar } from '@/components/ui/TopBar';
import { nextDeliveryStatusLabel } from '@/lib/deliveries';
import {
  canSellerCancel,
  formatMoney,
  formatPlacedAt,
  latestReturn,
  statusPresentation,
} from '@/lib/orders';
import { useOrders } from '@/lib/OrdersProvider';

export default function SellerOrderDetailScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { getOrder, advanceDelivery, respondToReturn } = useOrders();
  const { openSellerChat, isOpening } = useSellerChat();
  useOrdersRefresh();

  const order = id ? getOrder(id) : undefined;
  const [isAdvancing, setIsAdvancing] = useState(false);
  const [isDeliveryOpen, setIsDeliveryOpen] = useState(false);
  const [isCancelOpen, setIsCancelOpen] = useState(false);
  const [returnDecision, setReturnDecision] = useState<'approved' | 'rejected' | null>(null);
  const [isCompletingReturn, setIsCompletingReturn] = useState(false);
  const [returnError, setReturnError] = useState<string | null>(null);

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

  const advanceLabel = nextDeliveryStatusLabel(order.delivery?.status ?? 'pending');

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
          <Badge label={presentation.label} variant={presentation.variant} />
          <Text className="type-h2 text-primary">{order.ship_name ?? t('account.seller.buyer')}</Text>
          <Text className="type-text-secondary text-secondary">
            {t('orders.placed', { date: formatPlacedAt(order.placed_at) })}
          </Text>
        </View>

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

        {isCancelled ? (
          <OrderCancellationNotice order={order} viewer="seller" />
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
        animationType="fade"
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
