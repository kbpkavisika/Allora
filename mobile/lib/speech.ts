import * as Speech from 'expo-speech';
import { AccessibilityInfo } from 'react-native';

export interface SpeakOptions {
  onFinish?: () => void;
}

export function messageSpeech(senderLabel: string, body: string): string {
  return `${senderLabel} says: ${body}`;
}

export async function speak(text: string, { onFinish }: SpeakOptions = {}): Promise<void> {
  // A running screen reader would talk over the speech engine, so it announces the text instead.
  if (await AccessibilityInfo.isScreenReaderEnabled()) {
    AccessibilityInfo.announceForAccessibility(text);
    onFinish?.();
    return;
  }

  await Speech.stop();
  Speech.speak(text, { onDone: onFinish, onStopped: onFinish, onError: onFinish });
}

export function stopSpeaking(): Promise<void> {
  return Speech.stop();
}
