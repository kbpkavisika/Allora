import { useEffect, useRef, useState, type RefObject } from 'react';
import { useTranslation } from 'react-i18next';
import { AccessibilityInfo, Keyboard, Platform, type TextInput } from 'react-native';

type DictationOptions = {
  inputRef: RefObject<TextInput | null>;
  value: string;
  onChangeText: (text: string) => void;
  maxLength?: number;
  isDisabled?: boolean;
};

const LANGUAGE_LOCALES: Record<string, string> = { en: 'en-US', si: 'si-LK', ta: 'ta-LK' };
let dialogOpen = false;

export function useDictation(options: DictationOptions) {
  const { t, i18n } = useTranslation();
  const [isDictating, setIsDictating] = useState(false);
  const [feedback, setFeedback] = useState('');
  const latest = useRef(options);
  const mounted = useRef(false);

  useEffect(() => {
    latest.current = options;
  }, [options]);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  const hint = t(Platform.OS === 'android' ? 'input.dictateHintAndroid' : 'input.dictateHint');

  function openKeyboard(message: string) {
    latest.current.inputRef.current?.focus();
    setFeedback(message);
    AccessibilityInfo.announceForAccessibility(message);
  }

  async function dictate() {
    if (latest.current.isDisabled || dialogOpen) return;
    if (Platform.OS !== 'android') {
      openKeyboard(t('input.dictationHint'));
      return;
    }

    dialogOpen = true;
    const startingValue = latest.current.value;
    setIsDictating(true);
    setFeedback('');
    latest.current.inputRef.current?.blur();
    Keyboard.dismiss();

    const canApply = () => mounted.current && !latest.current.isDisabled && latest.current.value === startingValue;

    try {
      const { startActivityAsync, ResultCode } = await import('expo-intent-launcher');
      const language = i18n.resolvedLanguage ?? i18n.language;
      const result = await startActivityAsync('android.speech.action.RECOGNIZE_SPEECH', {
        extra: {
          'android.speech.extra.LANGUAGE_MODEL': 'free_form',
          'android.speech.extra.LANGUAGE': LANGUAGE_LOCALES[language] ?? language,
          'android.speech.extra.PROMPT': t('input.dictationPrompt'),
        },
      });
      if (!canApply() || result.resultCode === ResultCode.Canceled) return;
      if (result.resultCode !== ResultCode.Success) {
        openKeyboard(t('input.dictationUnavailable'));
        return;
      }
      const results: unknown = (result.extra as Record<string, unknown> | undefined)?.['android.speech.extra.RESULTS'];
      const transcript = Array.isArray(results) && typeof results[0] === 'string' ? results[0].trim() : '';
      if (!transcript) {
        openKeyboard(t('input.dictationUnavailable'));
        return;
      }
      const value = latest.current.value;
      if (latest.current.maxLength !== undefined && value.length >= latest.current.maxLength) return;
      const separator = value && !/\s$/.test(value) ? ' ' : '';
      const next = (value + separator + transcript).slice(0, latest.current.maxLength);
      if (next !== value) latest.current.onChangeText(next);
    } catch {
      if (canApply()) openKeyboard(t('input.dictationUnavailable'));
    } finally {
      dialogOpen = false;
      if (mounted.current) setIsDictating(false);
    }
  }

  return { dictate, isDictating, hint, feedback, clearFeedback: () => setFeedback('') };
}
