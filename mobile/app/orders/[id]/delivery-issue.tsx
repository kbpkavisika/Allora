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
import { DELIVERY_ISSUE_KINDS, type DeliveryIssueKind } from '@/lib/deliveries';
import { useOrders } from '@/lib/OrdersProvider';
import { deliveryIssueSchema, type DeliveryIssueValues } from '@/lib/schemas';

const KIND_LABELS = DELIVERY_ISSUE_KINDS.map((kind) => kind.label);
const LABEL_TO_VALUE = new Map(DELIVERY_ISSUE_KINDS.map((kind) => [kind.label, kind.value]));
const VALUE_TO_LABEL = new Map(DELIVERY_ISSUE_KINDS.map((kind) => [kind.value, kind.label]));

export default function DeliveryIssueScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { getOrder, reportDeliveryIssue } = useOrders();

  const order = id ? getOrder(id) : undefined;

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<DeliveryIssueValues>({
    resolver: zodResolver(deliveryIssueSchema),
    defaultValues: { kind: undefined, details: '' },
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function onSubmit(values: DeliveryIssueValues) {
    if (!order) return;

    setFormError(null);
    setIsSubmitting(true);
    const { error } = await reportDeliveryIssue({
      orderId: order.id,
      kind: values.kind,
      details: values.details,
    });
    setIsSubmitting(false);

    if (error) {
      setFormError('Could not send your report. Please try again.');
      return;
    }

    router.replace({ pathname: '/orders/[id]', params: { id: order.id, reported: '1' } });
  }

  if (!order) {
    return (
      <View className="flex-1 bg-surface">
        <TopBar title="Delivery problem" />
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
      <TopBar title="Delivery problem" />

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
            name="kind"
            render={({ field }) => (
              <ChipSelect
                label="What went wrong?"
                options={KIND_LABELS}
                value={field.value ? (VALUE_TO_LABEL.get(field.value) ?? '') : ''}
                onChange={(label) =>
                  field.onChange(LABEL_TO_VALUE.get(label) as DeliveryIssueKind)
                }
                error={errors.kind?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="details"
            render={({ field }) => (
              <InputField
                label="Tell us more"
                placeholder="When did you expect it, and what did the courier say?"
                value={field.value ?? ''}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                error={errors.details?.message}
                multiline
              />
            )}
          />

          <Callout message="The seller sees this on the order and marks it resolved once it's sorted." />

          <FormError message={formError} />

          <Button label="Report problem" loading={isSubmitting} onPress={handleSubmit(onSubmit)} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
