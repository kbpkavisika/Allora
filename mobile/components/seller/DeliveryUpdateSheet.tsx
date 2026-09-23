import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { KeyboardAvoidingView, Platform, Text, View } from 'react-native';

import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';
import { ChipSelect } from '@/components/ui/ChipSelect';
import { FormError } from '@/components/ui/FormError';
import { InputField } from '@/components/ui/InputField';
import {
  deliveryStatusFromLabel,
  deliveryStatusLabels,
  deliveryStatusPresentation,
  type Delivery,
  type DeliveryStatus,
} from '@/lib/deliveries';
import { useOrders } from '@/lib/OrdersProvider';
import { deliveryUpdateSchema, type DeliveryUpdateValues } from '@/lib/sellerSchemas';

export interface DeliveryUpdateSheetProps {
  orderId: string;
  delivery: Delivery | null;
  onDismiss: () => void;
}

export function DeliveryUpdateSheet({
  orderId,
  delivery,
  onDismiss,
}: DeliveryUpdateSheetProps) {
  const { updateDelivery } = useOrders();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<DeliveryUpdateValues>({
    resolver: zodResolver(deliveryUpdateSchema),
    defaultValues: {
      courierName: delivery?.courier_name ?? '',
      trackingNumber: delivery?.tracking_number ?? '',
      status: delivery?.status ?? 'pending',
    },
    mode: 'onSubmit',
    reValidateMode: 'onChange',
  });

  async function onSubmit(values: DeliveryUpdateValues) {
    setFormError(null);

    const { error } = await updateDelivery({
      orderId,
      status: values.status as DeliveryStatus,
      courierName: values.courierName,
      trackingNumber: values.trackingNumber,
    });

    if (error) {
      setFormError('Could not save these delivery details. Try again.');
      return;
    }

    onDismiss();
  }

  return (
    <BottomSheet onDismiss={onDismiss} label="Update delivery">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Text role="heading" className="type-h2 mb-4 text-primary" maxFontSizeMultiplier={1.5}>
          Update delivery
        </Text>

        <View className="gap-4">
          <Controller
            control={control}
            name="courierName"
            render={({ field }) => (
              <InputField
                label="Courier"
                isRequired
                placeholder="DHL"
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                error={errors.courierName?.message}
                isMicVisible={false}
                returnKeyType="next"
              />
            )}
          />

          <Controller
            control={control}
            name="trackingNumber"
            render={({ field }) => (
              <InputField
                label="Tracking number"
                isRequired
                placeholder="LK-88421"
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                error={errors.trackingNumber?.message}
                valueVariant="mono"
                autoCapitalize="characters"
                isMicVisible={false}
                returnKeyType="done"
                submitBehavior="blurAndSubmit"
              />
            )}
          />

          <Controller
            control={control}
            name="status"
            render={({ field }) => (
              <ChipSelect
                label="Status"
                required
                options={deliveryStatusLabels}
                value={deliveryStatusPresentation(field.value as DeliveryStatus).label}
                onChange={(label) => field.onChange(deliveryStatusFromLabel(label))}
                error={errors.status?.message}
              />
            )}
          />
        </View>

        <View className="mt-5 gap-3">
          <FormError message={formError} />
          <Button
            label="Save delivery"
            loading={isSubmitting}
            onPress={handleSubmit(onSubmit)}
          />
        </View>
      </KeyboardAvoidingView>
    </BottomSheet>
  );
}
