import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ReadAloudButton } from '@/components/payment/ReadAloudButton';
import {
  formatRefundConfirmationSpeech,
  formatRefundRequestSpeech,
} from '@/components/payment/paymentSpeech';
import { Button } from '@/components/ui/Button';
import { Callout } from '@/components/ui/Callout';
import { ChipSelect } from '@/components/ui/ChipSelect';
import { FormError } from '@/components/ui/FormError';
import { InputField } from '@/components/ui/InputField';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { TopBar } from '@/components/ui/TopBar';
import { formatMoney } from '@/lib/orders';
import { useOrders } from '@/lib/OrdersProvider';
import { refundService } from '@/services/refund/refundService';
import { REFUND_REASONS, type RefundReason } from '@/services/refund/refundTypes';

const REASON_LABELS = REFUND_REASONS.map((r) => r.label);
const LABEL_TO_VALUE = new Map(REFUND_REASONS.map((r) => [r.label, r.value]));
const VALUE_TO_LABEL = new Map(REFUND_REASONS.map((r) => [r.value, r.label]));

export default function RefundRequestScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { getOrder } = useOrders();

  const order = id ? getOrder(id) : undefined;

  const totalAmount = useMemo(() => {
    if (!order) return 0;
    return (
      order.total ||
      order.items.reduce((sum, item) => sum + item.unit_price * item.quantity, 0) ||
      0
    );
  }, [order]);

  const [refundType, setRefundType] = useState<'full' | 'partial'>('full');
  const [partialAmountText, setPartialAmountText] = useState('');
  const [selectedReason, setSelectedReason] = useState<RefundReason>('damaged');
  const [details, setDetails] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!order) {
    return (
      <View className="flex-1 bg-surface">
        <TopBar title="Request Refund" />
        <View className="items-center gap-3 p-4 pt-16">
          <Text role="heading" className="type-h3 text-primary">
            Order not found
          </Text>
          <Button
            variant="secondary"
            label="Back to orders"
            fullWidth={false}
            onPress={() => router.replace('/(tabs)/orders')}
          />
        </View>
      </View>
    );
  }

  const selectedAmount =
    refundType === 'full' ? totalAmount : parseFloat(partialAmountText) || 0;
  const reasonLabel = VALUE_TO_LABEL.get(selectedReason) ?? 'Other';
  const paymentReference = order.payment_reference || `ORDER-${order.order_number}`;
  const paymentMethodLabel =
    order.payment_method === 'payhere'
      ? 'PayHere'
      : order.payment_method === 'cod'
        ? 'Cash on Delivery'
        : 'PayHere';

  function validateStep(): boolean {
    setFormError(null);

    if (refundType === 'partial') {
      const parsed = parseFloat(partialAmountText.trim());
      if (isNaN(parsed) || parsed <= 0) {
        setFormError('Enter a valid refund amount greater than zero.');
        return false;
      }
      if (parsed > totalAmount) {
        setFormError(
          `Refund amount cannot exceed the order total of ${formatMoney(totalAmount)}.`
        );
        return false;
      }
    }

    if (!selectedReason) {
      setFormError('Please select a reason for the refund.');
      return false;
    }

    return true;
  }

  async function handleProceedToConfirm() {
    if (!validateStep()) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsConfirming(true);
  }

  async function handleSubmitRefund() {
    if (!validateStep()) {
      setIsConfirming(false);
      return;
    }

    setIsSubmitting(true);
    setFormError(null);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const outcome = await refundService.requestRefund({
      orderId: order!.id,
      orderNumber: order!.order_number,
      paymentReference,
      paymentMethod: paymentMethodLabel,
      totalOrderAmount: totalAmount,
      refundAmount: selectedAmount,
      refundType,
      reason: selectedReason,
      reasonDetails: details,
      currency: 'LKR',
    });

    setIsSubmitting(false);

    if (!outcome.success || !outcome.refund) {
      setFormError(outcome.error || 'Unable to submit refund request. Please try again.');
      return;
    }

    router.replace({
      pathname: '/orders/[id]/refund-status' as any,
      params: { id: order!.id },
    });
  }

  return (
    <View className="flex-1 bg-surface">
      <TopBar title={isConfirming ? 'Confirm Refund' : 'Request Refund'} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 40, gap: 24 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          {/* Order & Payment Summary Card */}
          <View className="gap-3 rounded-12 border-1 border-border bg-surface p-4">
            <Text className="type-label text-secondary">
              Order {order.order_number} · Placed{' '}
              {new Date(order.placed_at).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </Text>
            <View className="flex-row items-baseline justify-between">
              <Text className="type-label-lg text-primary">Total Paid</Text>
              <Text className="type-h3 text-primary">{formatMoney(totalAmount)}</Text>
            </View>
            <Text className="type-text-secondary text-secondary">
              Paid via {paymentMethodLabel} · Reference {paymentReference}
            </Text>
          </View>

          {!isConfirming ? (
            <>
              <ReadAloudButton
                text={formatRefundRequestSpeech({
                  orderNumber: order.order_number,
                  amount: totalAmount,
                  currency: 'LKR',
                })}
                label="Read aloud"
              />

              {/* Refund Type Selector */}
              <View className="gap-3">
                <SectionHeader title="Refund type" />
                <View className="flex-row gap-3">
                  <Pressable
                    accessibilityRole="radio"
                    accessibilityState={{ selected: refundType === 'full' }}
                    accessibilityLabel={`Full refund of ${formatMoney(totalAmount)}`}
                    onPress={() => {
                      setRefundType('full');
                      setFormError(null);
                    }}
                    className={`min-h-tap flex-1 items-center justify-center rounded-12 border-1.5 p-4 ${
                      refundType === 'full'
                        ? 'border-primary bg-primary-tint'
                        : 'border-border bg-surface'
                    }`}>
                    <Text
                      className={`type-label-lg ${
                        refundType === 'full' ? 'text-primary font-bold' : 'text-secondary'
                      }`}>
                      Full Refund
                    </Text>
                    <Text className="type-text-secondary text-secondary">
                      {formatMoney(totalAmount)}
                    </Text>
                  </Pressable>

                  <Pressable
                    accessibilityRole="radio"
                    accessibilityState={{ selected: refundType === 'partial' }}
                    accessibilityLabel="Partial refund"
                    onPress={() => {
                      setRefundType('partial');
                      setFormError(null);
                    }}
                    className={`min-h-tap flex-1 items-center justify-center rounded-12 border-1.5 p-4 ${
                      refundType === 'partial'
                        ? 'border-primary bg-primary-tint'
                        : 'border-border bg-surface'
                    }`}>
                    <Text
                      className={`type-label-lg ${
                        refundType === 'partial' ? 'text-primary font-bold' : 'text-secondary'
                      }`}>
                      Partial Refund
                    </Text>
                    <Text className="type-text-secondary text-secondary">Custom amount</Text>
                  </Pressable>
                </View>
              </View>

              {/* Partial Amount Input */}
              {refundType === 'partial' ? (
                <View className="gap-2">
                  <InputField
                    label="Refund amount (LKR)"
                    placeholder="e.g. 500"
                    keyboardType="numeric"
                    value={partialAmountText}
                    onChangeText={(val) => {
                      setPartialAmountText(val.replace(/[^0-9.]/g, ''));
                      setFormError(null);
                    }}
                    helperText={`Max refundable amount is ${formatMoney(totalAmount)}`}
                  />
                </View>
              ) : null}

              {/* Reason Selection */}
              <View className="gap-3">
                <SectionHeader title="Reason for refund" />
                <ChipSelect
                  label="Select the primary reason"
                  options={REASON_LABELS}
                  value={VALUE_TO_LABEL.get(selectedReason) ?? ''}
                  onChange={(lbl) => {
                    const mapped = LABEL_TO_VALUE.get(lbl) ?? 'other';
                    setSelectedReason(mapped);
                    setFormError(null);
                  }}
                />
              </View>

              {/* Optional Explanation */}
              {selectedReason === 'other' ? (
                <View className="gap-2">
                  <InputField
                    label="Additional details (optional)"
                    placeholder="Describe the issue with your item..."
                    value={details}
                    onChangeText={setDetails}
                    multiline
                  />
                </View>
              ) : null}

              <FormError message={formError} />

              <Button label="Review refund request" onPress={handleProceedToConfirm} />
            </>
          ) : (
            /* Confirmation Step */
            <View className="gap-5">
              <Callout
                tone="warning"
                message="This is a refund request. Submitting will send the request to be processed according to the payment provider's refund policies."
              />

              <View className="gap-4 rounded-12 border-1 border-border bg-surface p-4">
                <SectionHeader title="Refund request details" />
                <View className="flex-row items-center justify-between border-b-1 border-border pb-3">
                  <Text className="type-text-primary text-secondary">Refund amount</Text>
                  <Text className="type-h3 text-primary">{formatMoney(selectedAmount)}</Text>
                </View>
                <View className="flex-row items-center justify-between border-b-1 border-border pb-3">
                  <Text className="type-text-primary text-secondary">Reason</Text>
                  <Text className="type-label-lg text-primary">{reasonLabel}</Text>
                </View>
                {details.trim() ? (
                  <View className="border-b-1 border-border pb-3">
                    <Text className="type-text-secondary text-secondary">Details</Text>
                    <Text className="type-text-primary text-primary mt-1">{details.trim()}</Text>
                  </View>
                ) : null}
                <View className="flex-row items-center justify-between">
                  <Text className="type-text-primary text-secondary">Payment reference</Text>
                  <Text className="type-mono text-primary">{paymentReference}</Text>
                </View>
              </View>

              <ReadAloudButton
                text={formatRefundConfirmationSpeech({
                  amount: selectedAmount,
                  currency: 'LKR',
                  reason: reasonLabel,
                  reference: paymentReference,
                })}
                label="Read aloud confirmation"
              />

              <FormError message={formError} />

              <View className="gap-3">
                <Button
                  label={`Confirm refund (${formatMoney(selectedAmount)})`}
                  loading={isSubmitting}
                  disabled={isSubmitting}
                  onPress={handleSubmitRefund}
                />
                <Button
                  variant="secondary"
                  label="Edit request"
                  disabled={isSubmitting}
                  onPress={() => setIsConfirming(false)}
                />
              </View>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
