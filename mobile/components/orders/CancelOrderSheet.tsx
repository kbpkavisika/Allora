import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { ScrollView, Text, View } from 'react-native';

import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';
import { FormError } from '@/components/ui/FormError';
import { InputField } from '@/components/ui/InputField';
import { useOrders } from '@/lib/OrdersProvider';
import { cancelOrderSchema, type CancelOrderValues } from '@/lib/schemas';

export interface CancelOrderSheetProps {
  orderId: string;
  isSeller: boolean;
  onDismiss: () => void;
}

export function CancelOrderSheet({ orderId, isSeller, onDismiss }: CancelOrderSheetProps) {
  const { t } = useTranslation();
  const { cancelOrder } = useOrders();
  const [formError, setFormError] = useState<string | null>(null);
  const schema = useMemo(() => cancelOrderSchema(isSeller), [isSeller]);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CancelOrderValues>({
    resolver: zodResolver(schema),
    defaultValues: { reason: '' },
  });

  async function onSubmit({ reason }: CancelOrderValues) {
    setFormError(null);

    const { error } = await cancelOrder(orderId, reason);
    if (error) {
      setFormError(t('orders.cancel.error'));
      return;
    }

    onDismiss();
  }

  return (
    <BottomSheet onDismiss={onDismiss} label={t('orders.cancel.title')}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
        bounces={false}
        contentContainerStyle={{ paddingBottom: 16 }}>
        <Text role="heading" className="type-h2 mb-2 text-primary" maxFontSizeMultiplier={1.5}>
          {t('orders.cancel.title')}
        </Text>
        <Text className="type-text-primary mb-4 text-secondary">
          {isSeller ? t('orders.cancel.sellerBody') : t('orders.cancel.buyerBody')}
        </Text>

        <Controller
          control={control}
          name="reason"
          render={({ field }) => (
            <InputField
              label={isSeller ? t('orders.cancel.reason') : t('orders.cancel.reasonOptional')}
              isRequired={isSeller}
              placeholder={t('orders.cancel.reasonPlaceholder')}
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              error={errors.reason?.message}
              multiline
            />
          )}
        />

        <View className="mt-5 gap-3">
          <FormError message={formError} />
          <Button
            variant="destructive"
            label={t('orders.cancel.confirm')}
            loading={isSubmitting}
            onPress={handleSubmit(onSubmit)}
          />
          <Button variant="secondary" label={t('orders.cancel.keep')} onPress={onDismiss} />
        </View>
      </ScrollView>
    </BottomSheet>
  );
}
