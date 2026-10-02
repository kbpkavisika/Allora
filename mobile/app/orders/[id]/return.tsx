import { zodResolver } from '@hookform/resolvers/zod';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { Callout } from '@/components/ui/Callout';
import { ChipSelect } from '@/components/ui/ChipSelect';
import { FormError } from '@/components/ui/FormError';
import { InputField } from '@/components/ui/InputField';
import { TopBar } from '@/components/ui/TopBar';
import { canRequestReturn, returnReasonLabel, returnReasons } from '@/lib/orders';
import { useOrders } from '@/lib/OrdersProvider';
import { returnRequestSchema, type ReturnRequestValues } from '@/lib/schemas';

export default function ReturnRequestScreen() {
  const { t } = useTranslation();
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
    if (error) {
      setIsSubmitting(false);
      setFormError(t('returns.sendError'));
      return;
    }

    router.replace({ pathname: '/orders/[id]', params: { id: order.id, returned: '1' } });
  }

  if (!order || (!canRequestReturn(order) && !isSubmitting)) {
    return (
      <View className="flex-1 bg-surface">
        <TopBar title={t('orders.returnItem')} />
        <View className="items-center gap-3 p-4 pt-16">
          <Text role="heading" className="type-h3 text-primary">
            {order ? t('returns.unavailable') : t('orders.notFound')}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-surface">
      <TopBar title={t('orders.returnItem')} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 32, gap: 24 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <Text className="type-mono text-secondary">
            {t('orders.orderNumber', { number: order.order_number })} · {order.items[0]?.product_name}
          </Text>

          <Controller
            control={control}
            name="reason"
            render={({ field }) => (
              <ChipSelect
                label={t('returns.issue')}
                options={returnReasons}
                value={field.value ?? ''}
                onChange={field.onChange}
                formatOption={returnReasonLabel}
                error={errors.reason?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="details"
            render={({ field }) => (
              <InputField
                label={t('returns.details')}
                placeholder={t('returns.detailsPlaceholder')}
                value={field.value ?? ''}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                error={errors.details?.message}
                multiline
              />
            )}
          />

          <Callout message={t('returns.callout')} />

          <FormError message={formError} />

          <Button label={t('returns.submit')} loading={isSubmitting} onPress={handleSubmit(onSubmit)} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
