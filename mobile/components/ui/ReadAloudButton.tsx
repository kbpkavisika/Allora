import * as Speech from 'expo-speech';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Icon } from '@/components/ui/Icon';
import { IconButton } from '@/components/ui/IconButton';
import { useReadPage } from '@/hooks/usePageSpeech';

const SPEECH_LANGUAGE: Record<string, string> = {
  en: 'en-US',
  si: 'si-LK',
  ta: 'ta-LK',
};

export function ReadAloudButton() {
  const { t, i18n } = useTranslation();
  const readPage = useReadPage();
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
    const text = readPage();
    if (!text) return;

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

  return (
    <IconButton
      icon={<Icon name={isSpeaking ? 'stop' : 'speak'} size="lg" className="text-primary" />}
      label={isSpeaking ? t('readAloud.stop') : t('readAloud.label')}
      hint={isSpeaking ? t('readAloud.stopHint') : t('readAloud.hint')}
      onPress={() => {
        void handlePress();
      }}
    />
  );
}
