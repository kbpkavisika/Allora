import * as Speech from 'expo-speech';
import { useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/Button';

export interface ReadAloudButtonProps {
  text: string;
  label?: string;
  disabled?: boolean;
}

export function ReadAloudButton({ text, label = 'Read aloud', disabled = false }: ReadAloudButtonProps) {
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

    try {
      await Speech.stop();
      setIsSpeaking(true);
      Speech.speak(text, {
        rate: 0.85,
        pitch: 1.0,
      });
      await waitForSpeechToFinish();
    } catch {
      setIsSpeaking(false);
    }
  }

  return (
    <Button
      label={label}
      variant="secondary"
      size="md"
      onPress={() => {
        void handlePress();
      }}
      disabled={disabled}
      loading={isSpeaking}
      accessibilityLabel={label}
      accessibilityHint="Reads the payment information aloud"
      hint="Reads the payment information aloud"
      fullWidth={false}
      className="self-start"
    />
  );
}
