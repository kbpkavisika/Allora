import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { InputField } from '@/components/ui/InputField';
import { messageSchema, type MessageValues } from '@/lib/schemas';

export interface MessageComposerProps {
  onSend: (body: string) => Promise<boolean>;
  disabled?: boolean;
}

export function MessageComposer({ onSend, disabled = false }: MessageComposerProps) {
  const {
    control,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<MessageValues>({
    resolver: zodResolver(messageSchema),
    defaultValues: { body: '' },
  });

  const submit = handleSubmit(async ({ body }) => {
    if (await onSend(body)) reset();
  });

  return (
    <View className="flex-row items-start gap-2">
      <Controller
        control={control}
        name="body"
        render={({ field, fieldState }) => (
          <InputField
            label="Message"
            isLabelHidden
            width="half"
            placeholder="Write a message"
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={fieldState.error?.message}
            isDisabled={disabled}
            returnKeyType="send"
            submitBehavior="submit"
            onSubmitEditing={submit}
          />
        )}
      />

      <View className="min-h-control-field justify-center">
        <Button
          label="Send"
          size="md"
          fullWidth={false}
          loading={isSubmitting}
          disabled={disabled}
          onPress={submit}
          hint="Sends your message"
        />
      </View>
    </View>
  );
}
