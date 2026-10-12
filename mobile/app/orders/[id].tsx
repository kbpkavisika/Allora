import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DeliverySummary } from '@/components/orders/DeliverySummary';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Callout } from '@/components/ui/Callout';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { StepProgress } from '@/components/ui/StepProgress';
import { SuccessBanner } from '@/components/ui/SuccessBanner';
import { TopBar } from '@/components/ui/TopBar';
import { useSellerChat } from '@/hooks/useSellerChat';
import { deliveryTrackingStep } from '@/lib/deliveries';
import { formatMoney, statusPresentation, type OrderItem } from '@/lib/orders';
import { useOrders } from '@/lib/OrdersProvider';
import { formatDate } from '@/lib/i18n';

export default function OrderDetailScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { id, returned } = useLocalSearchParams<{ id?: string; returned?: string }>();
  const { getOrder, isLoading } = useOrders();
  const { openSellerChat, isOpening } = useSellerChat();

  const order = id ? getOrder(id) : undefined;

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
  const step = deliveryTrackingStep(order.delivery);
  const total = order.items.reduce((sum, item) => sum + item.unit_price * item.quantity, 0);

  return (
    <View className="flex-1 bg-surface">
      <TopBar title={t('orders.orderNumber', { number: order.order_number })} />

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

        <View className="gap-4">
          <SectionHeader title={t('orders.tracking')} />
          <StepProgress current={step.current} total={step.total} />
          <Text className="type-text-secondary text-secondary">
            {t('orders.step', { current: step.current, total: step.total, label: step.label })}
          </Text>
        </View>

        <DeliverySummary delivery={order.delivery} />

        <View className="gap-4">
          <SectionHeader title={t('orders.items')} />
          <View className="rounded-12 border-1 border-border bg-surface px-4">
            {order.items.map((item: OrderItem, index) => (
              <View
                key={item.id}
                className={`min-h-tap flex-row items-center gap-3 py-3 ${
                  index < order.items.length - 1 ? 'border-b-1 border-border' : ''
                }`}>
                <View className="flex-1 gap-0.5">
                  <Text className="type-label-lg text-primary" numberOfLines={2}>
                    {item.product_name}
                  </Text>
                  <Text className="type-text-secondary text-secondary">
                    {formatMoney(item.unit_price)} × {item.quantity}
                  </Text>
                </View>
                <Text className="type-text-primary text-primary">
                  {formatMoney(item.unit_price * item.quantity)}
                </Text>
              </View>
            ))}
          </View>
          <View className="flex-row items-center justify-between px-1">
            <Text className="type-label-lg text-primary">{t('cart.total')}</Text>
            <Text className="type-label-lg text-primary">{formatMoney(total)}</Text>
          </View>
        </View>

        <Callout message={t('orders.alertCallout')} />

        <View className="flex-row gap-3">
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
      </ScrollView>
    </View>
  );
}
