import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { KeyboardAvoidingView, Platform, Text, View } from 'react-native';

import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';
import { FormError } from '@/components/ui/FormError';
import { InputField } from '@/components/ui/InputField';
import { useOrders } from '@/lib/OrdersProvider';
import { returnResponseSchema, type ReturnResponseValues } from '@/lib/schemas';

export interface ReturnResponseSheetProps {
  returnId: string;
  decision: 'approved' | 'rejected';
  onDismiss: () => void;
}

export function ReturnResponseSheet({ returnId, decision, onDismiss }: ReturnResponseSheetProps) {
  const { t } = useTranslation();
  const { respondToReturn } = useOrders();
  const [formError, setFormError] = useState<string | null>(null);
  const isRejecting = decision === 'rejected';
  const schema = useMemo(() => returnResponseSchema(isRejecting), [isRejecting]);
  const title = isRejecting ? t('returns.rejectTitle') : t('returns.approveTitle');

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ReturnResponseValues>({
    resolver: zodResolver(schema),
    defaultValues: { note: '' },
  });

  async function onSubmit({ note }: ReturnResponseValues) {
    setFormError(null);

    const { error } = await respondToReturn({ returnId, decision, note });
    if (error) {
      setFormError(t('returns.respondError'));
      return;
    }

    onDismiss();
  }

  return (
    <BottomSheet onDismiss={onDismiss} label={title}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Text role="heading" className="type-h2 mb-2 text-primary" maxFontSizeMultiplier={1.5}>
          {title}
        </Text>
        <Text className="type-text-primary mb-4 text-secondary">
          {isRejecting ? t('returns.rejectBody') : t('returns.approveBody')}
        </Text>

        <Controller
          control={control}
          name="note"
          render={({ field }) => (
            <InputField
              label={isRejecting ? t('returns.note') : t('returns.noteOptional')}
              isRequired={isRejecting}
              placeholder={t('returns.notePlaceholder')}
              value={field.value}
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
            label={isRejecting ? t('returns.reject') : t('returns.approve')}
            loading={isSubmitting}
            onPress={handleSubmit(onSubmit)}
          />
        </View>
      </KeyboardAvoidingView>
    </BottomSheet>
  );
}
