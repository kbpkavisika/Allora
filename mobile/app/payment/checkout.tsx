import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PaymentMethodOption } from '@/components/payment/PaymentMethodOption';
import { Button } from '@/components/ui/Button';
import { FormError } from '@/components/ui/FormError';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { TopBar } from '@/components/ui/TopBar';
import { useAuth } from '@/lib/AuthProvider';
import { useCart } from '@/lib/CartProvider';
import { formatMoney, type PaymentMethod } from '@/lib/orders';
import { useOrders } from '@/lib/OrdersProvider';
import {
  initializePayHerePayment,
  isPayHereInitializationUnavailable,
} from '@/lib/payments/initializePayment';
import { buildPaymentReceiptPayload } from '@/lib/payments/paymentReceipt';
import { formatAddressLines } from '@/lib/profile';
import { useProfile } from '@/lib/ProfileProvider';
import { startPayHereCheckout } from '@/lib/payments/payHere';
import { sendPaymentReceipt } from '@/lib/payments/sendPaymentReceipt';

export default function CheckoutScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { lines, subtotal, clear } = useCart();
  const { addresses, profile } = useProfile();
  const { session } = useAuth();
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
      setError(t('checkout.addressRequired'));
      return;
    }

    setError(null);
    setIsSubmitting(true);

    if (method === 'payhere') {
      const fullName = profile?.full_name?.trim() ?? '';
      const [firstName, ...lastNameParts] = fullName.split(/\s+/).filter(Boolean);
      const temporaryFallbackOrderId = `CART-${Date.now()}`;
      let resolvedOrderId = temporaryFallbackOrderId;

      try {
        const initialization = await initializePayHerePayment(total);
        resolvedOrderId = initialization.payHereOrderId;
        console.info('[Checkout] PayHere initialization succeeded', {
          paymentId: initialization.paymentId,
          payHereOrderId: initialization.payHereOrderId,
        });
      } catch (initializationError) {
        if (isPayHereInitializationUnavailable(initializationError)) {
          console.warn(
            '[Checkout] Temporary PayHere initializer fallback: function unavailable; using local order ID generation.'
          );
        } else {
          setIsSubmitting(false);
          setError(
            initializationError instanceof Error
              ? initializationError.message
              : t('checkout.initError')
          );
          return;
        }
      }

      const outcome = await startPayHereCheckout({
        orderId: resolvedOrderId,
        amountLkr: total,
        lines,
        customer: {
          firstName: firstName || 'Customer',
          lastName: lastNameParts.join(' ') || firstName || 'Customer',
          email: session?.user.email ?? '',
          phone: profile?.phone ?? '',
        },
        address,
      });

      if (outcome.status !== 'completed' || !outcome.paymentId) {
        setIsSubmitting(false);
        if (outcome.status === 'failed' && outcome.error) {
          setError(outcome.error);
        }
        goToResult({ variant: 'failure', total: String(total) });
        return;
      }

      const { orders, error: placeError } = await placeOrder({
        lines,
        paymentMethod: 'payhere',
        paymentStatus: 'pending',
        paymentReference: outcome.paymentId,
        address,
      });

      if (placeError) {
        setIsSubmitting(false);
        setError(t('checkout.saveAfterPaymentError'));
        return;
      }

      const buyerEmail = session?.user.email ?? '';
      const buyerName = profile?.full_name?.trim() || 'Customer';

      if (buyerEmail) {
        const receiptPayload = buildPaymentReceiptPayload({
          buyerEmail,
          buyerName,
          paymentId: outcome.paymentId,
          payHereOrderId: resolvedOrderId,
          amount: total,
          currency: 'LKR',
          paymentMethod: 'payhere',
          paymentDate: new Date().toISOString(),
          orders: orders.map((order) => ({
            id: order.id,
            order_number: order.order_number,
            total: order.total,
          })),
          items: lines.map((line) => ({
            productName: line.product.name,
            quantity: line.quantity,
            unitPrice: line.product.price,
            lineTotal: line.product.price * line.quantity,
          })),
        });

        const receiptSent = await sendPaymentReceipt(receiptPayload);
        if (!receiptSent) {
          console.warn('[Checkout] Receipt email was not sent successfully, but the payment remains successful.');
        }
      } else {
        console.warn('[Checkout] Payment succeeded, but no authenticated email was available for the receipt.');
      }

      setIsSubmitting(false);
      await clear();
      goToResult({
        variant: 'success',
        orderId: orders[0]?.id ?? '',
        count: String(orders.length),
        total: String(total),
        reference: outcome.paymentId,
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
      setError(t('checkout.placeError'));
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
        <TopBar title={t('cart.checkout')} />
        <View className="items-center gap-3 p-4 pt-16">
          <Text role="heading" className="type-h3 text-primary">
            {t('checkout.emptyCart')}
          </Text>
          <Button
            variant="secondary"
            label={t('common.backToShop')}
            fullWidth={false}
            onPress={() => router.replace('/(tabs)')}
          />
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-surface">
      <TopBar title={t('cart.checkout')} />

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 140, gap: 24 }}
        showsVerticalScrollIndicator={false}>
        <View className="gap-4">
          <SectionHeader title={t('checkout.orderSummary')} />
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
            <Text className="type-label-lg text-primary">{t('cart.total')}</Text>
            <Text className="type-label-lg text-primary">{formatMoney(total)}</Text>
          </View>
        </View>

        <View className="gap-4">
          <SectionHeader
            title={t('checkout.deliveryAddress')}
            action={
              <Button
                variant="link"
                label={address ? t('checkout.change') : t('checkout.add')}
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
                {address.delivery_note ? (
                  <Text className="type-text-secondary mt-1 text-secondary">
                    {address.delivery_note}
                  </Text>
                ) : null}
              </>
            ) : (
              <Text className="type-text-primary text-secondary">
                {t('checkout.noAddress')}
              </Text>
            )}
          </View>
        </View>

        <View className="gap-4" accessibilityRole="radiogroup">
          <SectionHeader title={t('checkout.paymentMethod')} />
          <PaymentMethodOption
            method="payhere"
            title={t('checkout.payHere')}
            description={t('checkout.payHereDescription')}
            selected={method === 'payhere'}
            onPress={setMethod}
          />
          <PaymentMethodOption
            method="cod"
            title={t('checkout.cod')}
            description={t('checkout.codDescription')}
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
          <Text className="type-label-lg text-primary">{t('cart.total')}</Text>
          <Text className="type-h3 text-primary">{formatMoney(total)}</Text>
        </View>
        <Button
          label={
            method === 'payhere'
              ? t('checkout.pay', { amount: formatMoney(total) })
              : t('checkout.placeOrder')
          }
          loading={isSubmitting}
          onPress={submit}
          hint={
            method === 'payhere' ? t('checkout.payHint') : t('checkout.placeOrderHint')
          }
        />
      </View>
    </View>
  );
}
