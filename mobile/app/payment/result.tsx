import { router, useLocalSearchParams } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { Callout } from '@/components/ui/Callout';
import { Icon, type IconName } from '@/components/ui/Icon';
import { formatMoney } from '@/lib/orders';
import { useOrders } from '@/lib/OrdersProvider';

type ResultVariant = 'success' | 'failure' | 'cod';

type ResultParams = {
  variant?: string;
  orderId?: string;
  count?: string;
  total?: string;
  reference?: string;
};

const PRESENTATION: Record<
  ResultVariant,
  { icon: IconName; ring: string; iconColor: string; heading: string }
> = {
  success: {
    icon: 'check',
    ring: 'border-success bg-success-tint',
    iconColor: 'text-success',
    heading: 'Payment successful',
  },
  cod: {
    icon: 'orders',
    ring: 'border-success bg-success-tint',
    iconColor: 'text-success',
    heading: 'Order placed!',
  },
  failure: {
    icon: 'close',
    ring: 'border-error bg-error-tint',
    iconColor: 'text-error',
    heading: 'Payment failed',
  },
};

export default function PaymentResultScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<ResultParams>();
  const { getOrder } = useOrders();

  const variant: ResultVariant =
    params.variant === 'failure' ? 'failure' : params.variant === 'cod' ? 'cod' : 'success';
  const total = Number(params.total ?? '0');
  const count = Number(params.count ?? '1');
  const order = params.orderId ? getOrder(params.orderId) : undefined;
  const orderNumber = order?.order_number;

  const presentation = PRESENTATION[variant];

  function trackOrder() {
    if (count > 1 || !params.orderId) {
      router.replace('/(tabs)/orders');
      return;
    }
    router.replace({ pathname: '/orders/[id]', params: { id: params.orderId } });
  }

  return (
    <View className="flex-1 bg-surface">
      <ScrollView
        contentContainerStyle={{
          padding: 16,
          paddingTop: insets.top + 48,
          paddingBottom: insets.bottom + 32,
          gap: 24,
        }}>
        <View className="items-center gap-6">
          <View
            className={`h-16 w-16 items-center justify-center rounded-full border-1 ${presentation.ring}`}>
            <Icon name={presentation.icon} size="lg" className={presentation.iconColor} />
          </View>
          <View className="gap-2">
            <Text
              role="heading"
              className="type-h1 text-center text-primary"
              maxFontSizeMultiplier={1.5}>
              {presentation.heading}
            </Text>
            <Text className="type-text-lg text-center text-secondary">
              {variant === 'success'
                ? 'Your order is confirmed. A receipt has been sent to your email.'
                : variant === 'cod'
                  ? `Pay ${formatMoney(total)} in cash when your order arrives.`
                  : "The payment wasn't completed, so your order was not placed."}
            </Text>
          </View>
        </View>

        {variant === 'failure' ? (
          <Callout
            tone="warning"
            message="No amount was charged. Try the payment again, or choose a different method."
          />
        ) : null}

        <View className="gap-2 rounded-12 border-1 border-border bg-surface p-4">
          {count > 1 ? (
            <Text className="type-text-secondary text-secondary">
              {count} orders placed · one per shop
            </Text>
          ) : orderNumber ? (
            <Text className="type-mono text-secondary">Order {orderNumber}</Text>
          ) : null}

          <Text className="type-h2 text-primary">
            {variant === 'cod' ? `${formatMoney(total)} due on delivery` : formatMoney(total)}
          </Text>

          <Text className="type-text-secondary text-secondary">
            {variant === 'success'
              ? `Reference ${params.reference ?? 'N/A'} · Paid via PayHere`
              : variant === 'cod'
                ? 'Cash on delivery · Pay the courier directly'
                : 'Payment not completed'}
          </Text>
        </View>

        {variant === 'failure' ? (
          <View className="gap-3">
            <Button label="Try again" onPress={() => router.replace('/payment/checkout')} />
            <Text
              className="type-label-lg text-center text-primary underline"
              onPress={() => router.replace('/payment/checkout')}>
              Choose a different method
            </Text>
          </View>
        ) : (
          <View className="gap-3">
            <Button label="Track your order" onPress={trackOrder} />
            <Text
              className="type-label-lg text-center text-primary underline"
              onPress={() => router.replace('/(tabs)')}>
              Back to Shop
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
