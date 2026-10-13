import * as Speech from 'expo-speech';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Button, type ButtonVariant } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';

export interface ReadAloudButtonProps {
  text: string;
  label?: string;
  hint?: string;
  disabled?: boolean;
  fullWidth?: boolean;
  variant?: Extract<ButtonVariant, 'secondary' | 'social'>;
}

const SPEECH_LANGUAGE: Record<string, string> = {
  en: 'en-US',
  si: 'si-LK',
  ta: 'ta-LK',
};

export function ReadAloudButton({
  text,
  label,
  hint,
  disabled = false,
  fullWidth = false,
  variant = 'secondary',
}: ReadAloudButtonProps) {
  const { t, i18n } = useTranslation();
  const [isSpeaking, setIsSpeaking] = useState(false);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
      void Speech.stop();
    };
  }, []);

  function clearPolling() {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }

  async function waitForSpeechToFinish() {
    clearPolling();

    pollingRef.current = setInterval(async () => {
      try {
        const speaking = await Speech.isSpeakingAsync();
        if (!speaking) {
          clearPolling();
          setIsSpeaking(false);
        }
      } catch {
        clearPolling();
        setIsSpeaking(false);
      }
    }, 200);
  }

  async function handlePress() {
    if (!text.trim() || disabled) return;

    if (isSpeaking) {
      clearPolling();
      await Speech.stop();
      setIsSpeaking(false);
      return;
    }

    try {
      await Speech.stop();
      setIsSpeaking(true);
      Speech.speak(text, {
        language: SPEECH_LANGUAGE[i18n.language] ?? SPEECH_LANGUAGE.en,
        rate: 0.85,
        pitch: 1.0,
      });
      await waitForSpeechToFinish();
    } catch {
      clearPolling();
      setIsSpeaking(false);
    }
  }

  const currentLabel = isSpeaking ? t('readAloud.stop') : (label ?? t('readAloud.label'));
  const currentHint = isSpeaking ? t('readAloud.stopHint') : (hint ?? t('readAloud.hint'));

  return (
    <Button
      label={currentLabel}
      variant={variant}
      size="md"
      leadingIcon={
        <Icon
          name={isSpeaking ? 'stop' : 'speak'}
          size="md"
          className={disabled ? 'text-disabled' : 'text-primary'}
        />
      }
      onPress={() => {
        void handlePress();
      }}
      disabled={disabled}
      accessibilityLabel={currentLabel}
      accessibilityHint={currentHint}
      hint={currentHint}
      fullWidth={fullWidth}
      className={fullWidth ? '' : 'self-start'}
    />
  );
}
