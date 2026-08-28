import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PaymentMethodOption } from '@/components/payment/PaymentMethodOption';
import { Button } from '@/components/ui/Button';
import { FormError } from '@/components/ui/FormError';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { TopBar } from '@/components/ui/TopBar';
import { useCart } from '@/lib/CartProvider';
import { formatMoney, type PaymentMethod } from '@/lib/orders';
import { useOrders } from '@/lib/OrdersProvider';
import { formatAddressLines } from '@/lib/profile';
import { useProfile } from '@/lib/ProfileProvider';
import { startPayHereCheckout } from '@/lib/payments/payHere';

export default function CheckoutScreen() {
  const insets = useSafeAreaInsets();
  const { lines, subtotal, clear } = useCart();
  const { addresses } = useProfile();
  const { placeOrder } = useOrders();

  const address = useMemo(
    () => addresses.find((item) => item.is_default) ?? addresses[0] ?? null,
    [addresses]
  );

  const [method, setMethod] = useState<PaymentMethod>('payhere');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const total = subtotal;

  function goToResult(params: Record<string, string>) {
    router.replace({ pathname: '/payment/result', params });
  }

  async function submit() {
    if (!address) {
      setError('Add a delivery address before checking out.');
      return;
    }

    setError(null);
    setIsSubmitting(true);

    if (method === 'payhere') {
      const outcome = await startPayHereCheckout({
        orderId: `CART-${Date.now()}`,
        amountLkr: total,
      });

      if (outcome.status !== 'success') {
        setIsSubmitting(false);
        goToResult({ variant: 'failure', total: String(total) });
        return;
      }

      const { orders, error: placeError } = await placeOrder({
        lines,
        paymentMethod: 'payhere',
        paymentStatus: 'paid',
        paymentReference: outcome.reference,
        address,
      });

      setIsSubmitting(false);

      if (placeError) {
        setError('Payment went through but the order did not save. Contact support.');
        return;
      }

      await clear();
      goToResult({
        variant: 'success',
        orderId: orders[0]?.id ?? '',
        count: String(orders.length),
        total: String(total),
        reference: outcome.reference,
      });
      return;
    }

    const { orders, error: placeError } = await placeOrder({
      lines,
      paymentMethod: 'cod',
      paymentStatus: 'pending',
      address,
    });

    setIsSubmitting(false);

    if (placeError) {
      setError('Could not place the order. Please try again.');
      return;
    }

    await clear();
    goToResult({
      variant: 'cod',
      orderId: orders[0]?.id ?? '',
      count: String(orders.length),
      total: String(total),
    });
  }

  if (lines.length === 0) {
    return (
      <View className="flex-1 bg-surface">
        <TopBar title="Checkout" />
        <View className="items-center gap-3 p-4 pt-16">
          <Text role="heading" className="type-h3 text-primary">
            Your cart is empty
          </Text>
          <Button
            variant="secondary"
            label="Back to Shop"
            fullWidth={false}
            onPress={() => router.replace('/(tabs)')}
          />
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-surface">
      <TopBar title="Checkout" />

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 140, gap: 24 }}
        showsVerticalScrollIndicator={false}>
        <View className="gap-4">
          <SectionHeader title="Order summary" />
          <View className="gap-3 rounded-12 border-1 border-border bg-surface p-4">
            {lines.map((line) => (
              <View key={line.product.id} className="flex-row items-center justify-between gap-3">
                <Text className="type-label-lg flex-1 text-primary" numberOfLines={1}>
                  {line.product.name} × {line.quantity}
                </Text>
                <Text className="type-text-primary text-primary">
                  {formatMoney(line.product.price * line.quantity)}
                </Text>
              </View>
            ))}
          </View>
          <View className="flex-row items-center justify-between px-1">
            <Text className="type-label-lg text-primary">Total</Text>
            <Text className="type-label-lg text-primary">{formatMoney(total)}</Text>
          </View>
        </View>

        <View className="gap-4">
          <SectionHeader
            title="Delivery address"
            action={
              <Button
                variant="link"
                label={address ? 'Change' : 'Add'}
                fullWidth={false}
                onPress={() => router.push('/account/address')}
              />
            }
          />
          <View className="gap-1 rounded-12 border-1 border-border bg-surface p-4">
            {address ? (
              <>
                <Text className="type-text-primary text-primary">{address.label}</Text>
                {formatAddressLines(address).map((row) => (
                  <Text key={row} className="type-text-primary text-primary">
                    {row}
                  </Text>
                ))}
              </>
            ) : (
              <Text className="type-text-primary text-secondary">
                No address yet. Add one to continue.
              </Text>
            )}
          </View>
        </View>

        <View className="gap-4" accessibilityRole="radiogroup">
          <SectionHeader title="Payment method" />
          <PaymentMethodOption
            method="payhere"
            title="PayHere"
            description="Secure card and wallet payments"
            selected={method === 'payhere'}
            onPress={setMethod}
          />
          <PaymentMethodOption
            method="cod"
            title="Cash on delivery"
            description="Pay when your order arrives"
            selected={method === 'cod'}
            onPress={setMethod}
          />
        </View>

        <FormError message={error} />
      </ScrollView>

      <View
        className="absolute inset-x-0 bottom-0 gap-3 border-t-1 border-border bg-surface px-4 pt-4"
        style={{ paddingBottom: insets.bottom + 16 }}>
        <View className="flex-row items-center justify-between">
          <Text className="type-label-lg text-primary">Total</Text>
          <Text className="type-h3 text-primary">{formatMoney(total)}</Text>
        </View>
        <Button
          label={method === 'payhere' ? `Pay ${formatMoney(total)}` : 'Place order'}
          loading={isSubmitting}
          onPress={submit}
          hint={
            method === 'payhere'
              ? 'Opens PayHere to complete payment'
              : 'Places the order to pay on delivery'
          }
        />
      </View>
    </View>
  );
}
