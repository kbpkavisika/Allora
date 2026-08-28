import { zodResolver } from '@hookform/resolvers/zod';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { Callout } from '@/components/ui/Callout';
import { ChipSelect } from '@/components/ui/ChipSelect';
import { FormError } from '@/components/ui/FormError';
import { InputField } from '@/components/ui/InputField';
import { TopBar } from '@/components/ui/TopBar';
import { RETURN_REASONS, type ReturnReason } from '@/lib/orders';
import { useOrders } from '@/lib/OrdersProvider';
import { returnRequestSchema, type ReturnRequestValues } from '@/lib/schemas';

const REASON_LABELS = RETURN_REASONS.map((reason) => reason.label);
const LABEL_TO_VALUE = new Map(RETURN_REASONS.map((reason) => [reason.label, reason.value]));
const VALUE_TO_LABEL = new Map(RETURN_REASONS.map((reason) => [reason.value, reason.label]));

export default function ReturnRequestScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { getOrder, submitReturn } = useOrders();

  const order = id ? getOrder(id) : undefined;

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ReturnRequestValues>({
    resolver: zodResolver(returnRequestSchema),
    defaultValues: { reason: undefined, details: '' },
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function onSubmit(values: ReturnRequestValues) {
    if (!order) return;

    setFormError(null);
    setIsSubmitting(true);
    const { error } = await submitReturn({
      orderId: order.id,
      reason: values.reason,
      details: values.details,
    });
    setIsSubmitting(false);

    if (error) {
      setFormError('Could not send your request. Please try again.');
      return;
    }

    router.replace({ pathname: '/orders/[id]', params: { id: order.id, returned: '1' } });
  }

  if (!order) {
    return (
      <View className="flex-1 bg-surface">
        <TopBar title="Return item" />
        <View className="items-center gap-3 p-4 pt-16">
          <Text role="heading" className="type-h3 text-primary">
            Order not found
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-surface">
      <TopBar title="Return item" />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 32, gap: 24 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <Text className="type-mono text-secondary">
            Order {order.order_number} · {order.items[0]?.product_name}
          </Text>

          <Controller
            control={control}
            name="reason"
            render={({ field }) => (
              <ChipSelect
                label="What's the issue?"
                options={REASON_LABELS}
                value={field.value ? (VALUE_TO_LABEL.get(field.value) ?? '') : ''}
                onChange={(label) => field.onChange(LABEL_TO_VALUE.get(label) as ReturnReason)}
                error={errors.reason?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="details"
            render={({ field }) => (
              <InputField
                label="Tell us more"
                placeholder="Add any details that will help the seller resolve this quickly."
                value={field.value ?? ''}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                error={errors.details?.message}
                multiline
              />
            )}
          />

          <Callout message="Your request goes directly to the seller. Most replies arrive within 1–2 business days." />

          <FormError message={formError} />

          <Button label="Submit request" loading={isSubmitting} onPress={handleSubmit(onSubmit)} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
