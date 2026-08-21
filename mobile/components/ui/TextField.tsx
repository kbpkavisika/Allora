import { forwardRef, useEffect, useId, useState } from 'react';
import {
  AccessibilityInfo,
  Platform,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native';

import { Icon } from '@/components/ui/Icon';
import { IconButton } from '@/components/ui/IconButton';
import { useThemeColor } from '@/hooks/useThemeColor';

export interface TextFieldProps
  extends Omit<
    TextInputProps,
    'style' | 'secureTextEntry' | 'placeholderTextColor' | 'aria-label' | 'className'
  > {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  error?: string | null;
  required?: boolean;
  secure?: boolean;
  showMic?: boolean;
  onMicPress?: () => void;
  containerClassName?: string;
}

export const TextField = forwardRef<TextInput, TextFieldProps>(function TextField(
  {
    label,
    value,
    onChangeText,
    error,
    required = false,
    secure = false,
    showMic = true,
    onMicPress,
    containerClassName = '',
    onFocus,
    onBlur,
    ...rest
  },
  ref
) {
  const id = useId();
  const [focused, setFocused] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const hasError = Boolean(error);
  const micVisible = !secure && showMic;

  // selectionColor is a prop, not a style, so no class can reach it.
  const caretColor = useThemeColor({}, 'info');

  // RN has no aria-invalid or aria-describedby, so the message rides along in the name.
  const accessibleName = [label, required && 'required', hasError && `error, ${error}`]
    .filter(Boolean)
    .join(', ');

  // The live region below is Android-only; iOS needs an explicit announcement.
  useEffect(() => {
    if (error && Platform.OS === 'ios') {
      AccessibilityInfo.announceForAccessibility(`${label}: ${error}`);
    }
  }, [error, label]);

  const border = hasError
    ? 'border-1.5 border-error'
    : focused
      ? 'border-1.5 border-primary'
      : 'border-1 border-border-strong';

  return (
    <View className={containerClassName}>
      <View className="mb-1 flex-row items-center gap-2">
        <Text
          nativeID={`${id}-label`}
          className={`type-label-lg ${hasError ? 'text-error' : 'text-primary'}`}>
          {label}
        </Text>
        {required ? <Text className="type-text-primary text-secondary">Required</Text> : null}
      </View>

      <View
        className={`min-h-control-lg flex-row items-center gap-2 rounded-8 bg-surface px-4 py-2 ${border}`}>
        <TextInput
          ref={ref}
          className="type-text-primary flex-1 text-primary placeholder:text-secondary"
          value={value}
          onChangeText={onChangeText}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          secureTextEntry={secure && !revealed}
          selectionColor={caretColor}
          aria-label={accessibleName}
          aria-labelledby={`${id}-label`}
          {...rest}
        />

        {secure ? (
          <IconButton
            diameter={32}
            icon={<Icon name={revealed ? 'hide' : 'show'} size="md" className="text-secondary" />}
            label={revealed ? 'Hide password' : 'Show password'}
            hint={revealed ? 'Conceals the password' : 'Reveals the password as plain text'}
            onPress={() => setRevealed((v) => !v)}
          />
        ) : micVisible ? (
          <IconButton
            diameter={32}
            icon={
              <Icon
                name="dictate"
                size="md"
                className={onMicPress ? 'text-primary' : 'text-disabled'}
              />
            }
            label={`Dictate ${label.toLowerCase()}`}
            disabled={!onMicPress}
            onPress={onMicPress}
          />
        ) : null}
      </View>

      {hasError ? (
        <Text
          nativeID={`${id}-error`}
          role="alert"
          aria-live="assertive"
          className="type-text-primary mt-1 text-error">
          {error}
        </Text>
      ) : null}
    </View>
  );
});
