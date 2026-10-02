import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AccessibilityInfo, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PaymentMethodOption } from '@/components/payment/PaymentMethodOption';
import { PaymentAuthentication } from '@/components/payment/PaymentAuthentication';
import { Button } from '@/components/ui/Button';
import { Callout } from '@/components/ui/Callout';
import { FormError } from '@/components/ui/FormError';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { TopBar } from '@/components/ui/TopBar';
import { useAuth } from '@/lib/AuthProvider';
import { useCart } from '@/lib/CartProvider';
import { formatMoney, type PaymentMethod } from '@/lib/orders';
import { useOrders } from '@/lib/OrdersProvider';
import {
  abandonPayHereCheckout,
  initializePayHerePayment,
  type PayHerePaymentInitializationResult,
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
  const { placeOrder, refresh: refreshOrders } = useOrders();

  const address = useMemo(
    () => addresses.find((item) => item.is_default) ?? addresses[0] ?? null,
    [addresses]
  );

  type PaymentState =
    | 'idle'
    | 'authentication_required'
    | 'processing'
    | 'success'
    | 'failed'
    | 'cancelled'
    | 'pending';

  const [paymentState, setPaymentState] = useState<PaymentState>('idle');
  const [method, setMethod] = useState<PaymentMethod>('payhere');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAuthenticatingPayment, setIsAuthenticatingPayment] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const otpVerifiedRef = useRef(false);
  const isProcessingPaymentRef = useRef(false);

  const total = subtotal;

  function goToResult(params: Record<string, string>) {
    router.replace({ pathname: '/payment/result', params });
  }

  async function executePayment() {
    if (isProcessingPaymentRef.current) {
      return;
    }

    if (!address) {
      setError(t('checkout.addressRequired'));
      return;
    }

    setError(null);

    if (method === 'payhere' && !(otpVerified || otpVerifiedRef.current)) {
      console.warn('[CheckoutOTP] blocked PayHere execution before verification');
      return;
    }

    isProcessingPaymentRef.current = true;
    setIsSubmitting(true);
    setPaymentState('processing');

    try {
      if (method === 'payhere') {
        const fullName = profile?.full_name?.trim() ?? '';
        const [firstName, ...lastNameParts] = fullName.split(/\s+/).filter(Boolean);

        const { orders, error: placeError } = await placeOrder({
          lines,
          paymentMethod: 'payhere',
          address,
        });

        if (placeError) {
          setIsSubmitting(false);
          setPaymentState('failed');
          setError(t('checkout.placeError'));
          return;
        }

        const orderIds = orders.map((order) => order.id);

        async function releaseOrders() {
          await abandonPayHereCheckout(orderIds);
          await refreshOrders();
        }

        let initialization: PayHerePaymentInitializationResult;
        try {
          initialization = await initializePayHerePayment(orderIds);
        } catch {
          await releaseOrders();
          setIsSubmitting(false);
          setPaymentState('failed');
          setError(t('checkout.initError'));
          return;
        }

        const paidTotal = initialization.amount;

        const outcome = await startPayHereCheckout({
          orderId: initialization.payHereOrderId,
          amountLkr: paidTotal,
          lines,
          customer: {
            firstName: firstName || 'Customer',
            lastName: lastNameParts.join(' ') || firstName || 'Customer',
            email: session?.user.email ?? '',
            phone: profile?.phone ?? '',
          },
          address,
        });

        if (outcome.status === 'cancelled') {
          await releaseOrders();
          setIsSubmitting(false);
          setPaymentState('cancelled');
          console.info('[Checkout] PayHere checkout was cancelled by user');
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          AccessibilityInfo.announceForAccessibility('Payment was cancelled. No charges were made.');
          return;
        }

        if (outcome.status !== 'completed' || !outcome.paymentId) {
          await releaseOrders();
          setIsSubmitting(false);
          setPaymentState('failed');
          const failureMessage =
            outcome.status === 'failed' && outcome.error
              ? outcome.error
              : 'Payment could not be completed.';
          setError(failureMessage);
          goToResult({ variant: 'failure', total: String(paidTotal), message: failureMessage });
          return;
        }

        const buyerEmail = session?.user.email ?? '';
        const buyerName = profile?.full_name?.trim() || 'Customer';

        if (buyerEmail) {
          const receiptPayload = buildPaymentReceiptPayload({
            buyerEmail,
            buyerName,
            paymentId: outcome.paymentId,
            payHereOrderId: initialization.payHereOrderId,
            amount: paidTotal,
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

          void sendPaymentReceipt(receiptPayload).then((receiptSent) => {
            if (!receiptSent) {
              console.warn('[Checkout] Receipt email was not sent successfully, but the payment remains successful.');
            }
          });
        } else {
          console.warn('[Checkout] Payment succeeded, but no authenticated email was available for the receipt.');
        }

        setPaymentState('success');
        setIsSubmitting(false);
        await clear();
        goToResult({
          variant: 'success',
          orderId: orders[0]?.id ?? '',
          count: String(orders.length),
          total: String(paidTotal),
          reference: outcome.paymentId,
        });
        return;
      }

      const { orders, error: placeError } = await placeOrder({
        lines,
        paymentMethod: 'cod',
        address,
      });

      if (placeError) {
        setIsSubmitting(false);
        setPaymentState('failed');
        setError(t('checkout.placeError'));
        return;
      }

      setPaymentState('success');
      setIsSubmitting(false);
      await clear();
      goToResult({
        variant: 'cod',
        orderId: orders[0]?.id ?? '',
        count: String(orders.length),
        total: String(total),
      });
    } finally {
      isProcessingPaymentRef.current = false;
    }
  }

  function handlePayPress() {
    console.info('[CheckoutOTP] Pay pressed');

    if (isSubmitting || isProcessingPaymentRef.current || isAuthenticatingPayment) {
      return;
    }

    if (!address) {
      setError(t('checkout.addressRequired'));
      return;
    }

    if (method !== 'payhere') {
      void executePayment();
      return;
    }

    otpVerifiedRef.current = false;
    setOtpVerified(false);
    setError(null);
    setPaymentState('authentication_required');
    setIsAuthenticatingPayment(true);
    console.info('[CheckoutOTP] showing authentication');
  }

  function handleOtpVerified() {
    if (isProcessingPaymentRef.current || !isAuthenticatingPayment || method !== 'payhere') return;

    console.info('[CheckoutOTP] verification succeeded');
    otpVerifiedRef.current = true;
    setOtpVerified(true);
    setIsAuthenticatingPayment(false);
    setPaymentState('processing');
    console.info('[CheckoutOTP] continuing to PayHere');
    void executePayment();
  }

  function handleAuthenticationCancel() {
    otpVerifiedRef.current = false;
    setOtpVerified(false);
    setIsAuthenticatingPayment(false);
    setPaymentState('idle');
    setError(null);
    AccessibilityInfo.announceForAccessibility('Payment authentication cancelled.');
    console.info('[CheckoutOTP] authentication cancelled');
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

        {isAuthenticatingPayment ? (
          <PaymentAuthentication
            onVerified={handleOtpVerified}
            onCancel={handleAuthenticationCancel}
          />
        ) : null}

        {paymentState === 'cancelled' ? (
          <Callout
            tone="info"
            message="Payment was cancelled. You can review your details and try again whenever you are ready."
          />
        ) : null}

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
          label={method === 'payhere' ? t('checkout.pay', { amount: formatMoney(total) }) : t('checkout.placeOrder')}
          loading={isSubmitting || paymentState === 'processing'}
          disabled={isSubmitting || isAuthenticatingPayment || paymentState === 'processing'}
          onPress={handlePayPress}
          hint={
            method === 'payhere'
              ? t('checkout.payHint')
              : t('checkout.placeOrderHint')
          }
        />
      </View>
    </View>
  );
}
