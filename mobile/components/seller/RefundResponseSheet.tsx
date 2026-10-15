import { zodResolver } from '@hookform/resolvers/zod';
import * as Haptics from 'expo-haptics';
import { useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { AccessibilityInfo, ScrollView, Text, View } from 'react-native';

import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';
import { FormError } from '@/components/ui/FormError';
import { InputField } from '@/components/ui/InputField';
import { formatMoney } from '@/lib/orders';
import { refundResponseSchema, type RefundResponseValues } from '@/lib/schemas';
import { refundService } from '@/services/refund/refundService';

export interface RefundResponseSheetProps {
  orderId: string;
  refundId: string;
  refundAmount: number;
  orderNumber: string;
  decision: 'approved' | 'rejected';
  onDismiss: () => void;
  onSuccess: () => void;
}

export function RefundResponseSheet({
  orderId,
  refundId,
  refundAmount,
  orderNumber,
  decision,
  onDismiss,
  onSuccess,
}: RefundResponseSheetProps) {
  const { t } = useTranslation();
  const [formError, setFormError] = useState<string | null>(null);
  const isRejecting = decision === 'rejected';
  const schema = useMemo(() => refundResponseSchema(isRejecting), [isRejecting]);

  const title = isRejecting
    ? t('refund.rejectTitle', { defaultValue: 'Decline Refund Request' })
    : t('refund.approveTitle', { defaultValue: 'Approve & Issue Refund' });

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RefundResponseValues>({
    resolver: zodResolver(schema),
    defaultValues: { note: '' },
  });

  async function onSubmit({ note }: RefundResponseValues) {
    setFormError(null);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const outcome = await refundService.respondToRefund({
      refundId,
      orderId,
      decision: isRejecting ? 'failed' : 'refunded',
      note: note?.trim() || undefined,
    });

    if (!outcome.success) {
      const msg =
        outcome.error ||
        t('refund.respondError', {
          defaultValue: 'Could not update the refund status. Please try again.',
        });
      setFormError(msg);
      AccessibilityInfo.announceForAccessibility(msg);
      return;
    }

    if (isRejecting) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      AccessibilityInfo.announceForAccessibility(
        `Refund request declined for order ${orderNumber}.`
      );
    } else {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      AccessibilityInfo.announceForAccessibility(
        `Refund of ${formatMoney(refundAmount)} approved and completed for order ${orderNumber}.`
      );
    }

    onSuccess();
  }

  return (
    <BottomSheet onDismiss={onDismiss} label={title}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
        bounces={false}
        contentContainerStyle={{ paddingBottom: 16 }}>
        <Text role="heading" className="type-h2 mb-2 text-primary" maxFontSizeMultiplier={1.5}>
          {title}
        </Text>
        <Text className="type-text-primary mb-4 text-secondary">
          {isRejecting
            ? `${t('refund.rejectBody', {
                defaultValue:
                  'Provide a clear reason why this refund request cannot be approved for Order #',
              })}${orderNumber}.`
            : `${t('refund.approveBody', {
                defaultValue: 'Confirm that you want to approve this refund of ',
              })}${formatMoney(refundAmount)} for Order #${orderNumber}. This will mark the order payment as refunded and complete the request.`}
        </Text>

        <Controller
          control={control}
          name="note"
          render={({ field }) => (
            <InputField
              label={
                isRejecting
                  ? t('refund.note', { defaultValue: 'Reason for declining' })
                  : t('refund.noteOptional', { defaultValue: 'Note to buyer (optional)' })
              }
              isRequired={isRejecting}
              placeholder={
                isRejecting
                  ? t('refund.notePlaceholder', {
                      defaultValue: 'e.g. Item delivered intact and as described...',
                    })
                  : t('refund.noteOptionalPlaceholder', {
                      defaultValue: 'e.g. Refund issued to original payment method...',
                    })
              }
              value={field.value ?? ''}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              error={errors.note?.message}
              multiline
            />
          )}
        />

        <View className="mt-5 gap-3">
          <FormError message={formError} />
          <Button
            variant={isRejecting ? 'destructive' : 'primary'}
            label={
              isRejecting
                ? t('refund.reject', { defaultValue: 'Decline Refund' })
                : t('refund.approve', { defaultValue: 'Confirm Refund' })
            }
            loading={isSubmitting}
            onPress={handleSubmit(onSubmit)}
          />
        </View>
      </ScrollView>
    </BottomSheet>
  );
}
