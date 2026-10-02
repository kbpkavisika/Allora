import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useRef, useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { AccessibilityInfo, Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { InputField } from '@/components/ui/InputField';
import { useVoiceRecorder, type VoiceRecording } from '@/hooks/useVoiceRecorder';
import { formatVoiceDuration, VOICE_NOTE_MAX_MS } from '@/lib/chat';
import { messageSchema, type MessageValues } from '@/lib/schemas';

export type VoiceRecordingProblem = 'denied' | 'failed';

export interface MessageComposerProps {
  onSend: (body: string) => Promise<boolean>;
  onSendVoice: (recording: VoiceRecording) => Promise<boolean>;
  onVoiceProblem: (problem: VoiceRecordingProblem) => void;
  disabled?: boolean;
}

type VoiceMode = 'idle' | 'recording' | 'sending';

export function MessageComposer({
  onSend,
  onSendVoice,
  onVoiceProblem,
  disabled = false,
}: MessageComposerProps) {
  const { t } = useTranslation();
  const recorder = useVoiceRecorder();
  const [voiceMode, setVoiceMode] = useState<VoiceMode>('idle');
  const isActiveRef = useRef(false);
  const limitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const {
    control,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<MessageValues>({
    resolver: zodResolver(messageSchema),
    defaultValues: { body: '' },
  });

  const body = useWatch({ control, name: 'body' });
  const hasText = body.trim().length > 0;

  const submit = handleSubmit(async ({ body: text }) => {
    if (await onSend(text)) reset();
  });

  function endActiveRecording() {
    if (!isActiveRef.current) return false;

    isActiveRef.current = false;
    if (limitTimerRef.current) clearTimeout(limitTimerRef.current);
    return true;
  }

  async function startRecording() {
    const result = await recorder.start();

    if (result !== 'recording') {
      onVoiceProblem(result);
      return;
    }

    isActiveRef.current = true;
    limitTimerRef.current = setTimeout(sendRecording, VOICE_NOTE_MAX_MS);
    setVoiceMode('recording');
    AccessibilityInfo.announceForAccessibility(t('composer.recordingStarted'));
  }

  async function cancelRecording() {
    if (!endActiveRecording()) return;

    await recorder.cancel();
    setVoiceMode('idle');
    AccessibilityInfo.announceForAccessibility(t('composer.recordingCancelled'));
  }

  async function sendRecording() {
    if (!endActiveRecording()) return;

    setVoiceMode('sending');
    const recording = await recorder.finish();

    if (!recording) {
      setVoiceMode('idle');
      onVoiceProblem('failed');
      return;
    }

    await onSendVoice(recording);
    setVoiceMode('idle');
  }

  useEffect(
    () => () => {
      if (limitTimerRef.current) clearTimeout(limitTimerRef.current);
    },
    []
  );

  if (voiceMode !== 'idle') {
    const isSending = voiceMode === 'sending';

    return (
      <View className="min-h-control-field flex-row items-center gap-2">
        <View className="flex-1 flex-row items-center gap-2">
          <View className="h-2 w-2 rounded-full bg-error" aria-hidden />
          <Text className="type-label-lg text-primary" maxFontSizeMultiplier={1.5}>
            {isSending
              ? t('composer.sendingVoice')
              : t('composer.recording', { time: formatVoiceDuration(recorder.durationMs) })}
          </Text>
        </View>

        <Button
          variant="secondary"
          label={t('common.cancel')}
          size="md"
          fullWidth={false}
          disabled={isSending}
          onPress={cancelRecording}
          hint={t('composer.cancelVoiceHint')}
        />
        <Button
          label={t('composer.send')}
          size="md"
          fullWidth={false}
          loading={isSending}
          onPress={sendRecording}
          hint={t('composer.sendVoiceHint')}
        />
      </View>
    );
  }

  return (
    <View className="flex-row items-start gap-2">
      <Controller
        control={control}
        name="body"
        render={({ field, fieldState }) => (
          <InputField
            label={t('composer.label')}
            isLabelHidden
            width="half"
            placeholder={t('composer.placeholder')}
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
        {hasText ? (
          <Button
            label={t('composer.send')}
            size="md"
            fullWidth={false}
            loading={isSubmitting}
            disabled={disabled}
            onPress={submit}
            hint={t('composer.sendHint')}
          />
        ) : (
          <Button
            label={t('composer.record')}
            size="md"
            fullWidth={false}
            disabled={disabled}
            onPress={startRecording}
            hint={t('composer.recordHint')}
          />
        )}
      </View>
    </View>
  );
}
