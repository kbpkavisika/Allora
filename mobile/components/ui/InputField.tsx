import { useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native';
import { useTranslation } from 'react-i18next';

import { Icon } from '@/components/ui/Icon';
import { IconButton } from '@/components/ui/IconButton';
import { largeTextStep, typographySpecs } from '@/constants/theme';
import { useProfile } from '@/hooks/useProfile';
import { useThemeColor } from '@/hooks/useThemeColor';

export type InputFieldVariant = 'field' | 'search';
export type InputFieldWidth = 'full' | 'half' | 'auto';
export type InputFieldValueVariant = 'text' | 'mono';

type InputState = 'rest' | 'focus' | 'error' | 'disabled';

const VALUE_TOKEN = {
  text: 'text-primary',
  mono: 'mono',
} as const satisfies Record<InputFieldValueVariant, keyof typeof typographySpecs>;

function toValueTextStyle(variant: InputFieldValueVariant, largeText: boolean) {
  const token = VALUE_TOKEN[variant];
  const spec = typographySpecs[token];
  const fontSize = (largeText ? largeTextStep(token)?.fontSize : undefined) ?? spec.fontSize;
  return { fontFamily: spec.fontFamily, fontSize, includeFontPadding: false } as const;
}

const TONE = {
  primary: 'text-primary',
  secondary: 'text-secondary',
  disabled: 'text-disabled',
  error: 'text-error',
} as const;


type BaseProps = Omit<
  TextInputProps,
  | 'style'
  | 'className'
  | 'secureTextEntry'
  | 'editable'
  | 'placeholderTextColor'
  | 'selectionColor'
  | 'cursorColor'
  | 'underlineColorAndroid'
  | 'textAlign'
  | 'textAlignVertical'
  | 'multiline'
  | 'numberOfLines'
  | 'aria-label'
> & {
  value: string;
  onChangeText: (text: string) => void;

  error?: string | null;
  helperText?: string;
  isDisabled?: boolean;
  isRevealed?: boolean;

  onFocus?: TextInputProps['onFocus'];
  onBlur?: TextInputProps['onBlur'];
  onSubmitEditing?: TextInputProps['onSubmitEditing'];
  onKeyPress?: TextInputProps['onKeyPress'];
  onRevealToggle?: (isNextRevealed: boolean) => void;

  width?: InputFieldWidth;
  valueVariant?: InputFieldValueVariant;
  isMicVisible?: boolean;
  trailingAccessory?: React.ReactNode;
  isLabelHidden?: boolean;
  multiline?: boolean;
  className?: string;
  ref?: React.Ref<TextInput>;
};

type FieldProps = BaseProps & {
  variant?: 'field';
  label: string;
  isRequired?: boolean;
  isSecure?: boolean;
  onClear?: never;
};

type SearchProps = BaseProps & {
  variant: 'search';
  label?: string;
  isRequired?: never;
  isSecure?: never;
  onClear: () => void;
};

export type InputFieldProps = FieldProps | SearchProps;

const CONTAINER: Record<InputFieldVariant, Record<InputState, string>> = {
  field: {
    rest: 'rounded-8 border-1 border-border-strong bg-surface',
    focus: 'rounded-8 border-1.5 border-primary bg-surface',
    error: 'rounded-8 border-1.5 border-error bg-surface',
    disabled: 'rounded-8 border-1 border-border bg-surface',
  },
  search: {
    rest: 'rounded-full border-1.5 border-transparent bg-surface-sunken',
    focus: 'rounded-full border-1.5 border-primary bg-surface',
    error: 'rounded-full border-1.5 border-error bg-surface',
    disabled: 'rounded-full border-1.5 border-transparent bg-surface-sunken',
  },
};

const LABEL_TONE: Record<InputState, string> = {
  rest: TONE.primary,
  focus: TONE.primary,
  error: TONE.error,
  disabled: TONE.disabled,
};

const VALUE_TONE: Record<InputState, string> = {
  rest: TONE.primary,
  focus: TONE.primary,
  error: TONE.primary,
  disabled: TONE.disabled,
};

const WIDTH: Record<InputFieldWidth, string> = {
  full: 'w-full',
  half: 'flex-1',
  auto: 'self-start',
};

const MIN_HEIGHT: Record<InputFieldVariant, string> = {
  field: 'min-h-control-field',
  search: 'min-h-control-lg',
};

function resolveState(isDisabled: boolean, hasError: boolean, isActive: boolean): InputState {
  if (isDisabled) return 'disabled';
  if (hasError) return 'error';
  if (isActive) return 'focus';
  return 'rest';
}

export function InputField({
  variant = 'field',
  label,
  value,
  onChangeText,
  error,
  helperText,
  isDisabled = false,
  isRevealed,
  isRequired = false,
  isSecure = false,
  isMicVisible = true,
  trailingAccessory,
  isLabelHidden = false,
  width = 'full',
  valueVariant = 'text',
  multiline = false,
  onFocus,
  onBlur,
  onSubmitEditing,
  onKeyPress,
  onClear,
  onRevealToggle,
  className = '',
  ref,
  ...rest
}: Readonly<InputFieldProps>) {
  const { t } = useTranslation();
  const [isFocused, setIsFocused] = useState(false);
  const [isRevealedInternal, setIsRevealedInternal] = useState(false);
  const [isDictationHintShown, setIsDictationHintShown] = useState(false);
  const inputRef = useRef<TextInput | null>(null);

  const hasError = Boolean(error);
  const isSearch = variant === 'search';
  const isPasswordRevealed = isRevealed ?? isRevealedInternal;
  const isActive = isFocused || (isSearch && value.length > 0);
  const state = resolveState(isDisabled, hasError, isActive);

  const { profile } = useProfile();
  const caretColor = useThemeColor({}, 'info');
  const placeholderColor = useThemeColor({}, isDisabled ? 'disabled' : 'secondary');

  const resolvedLabel = label ?? t('shop.searchPlaceholder');
  const dictationHint = t('input.dictationHint');

  // React Native exposes no aria-invalid, aria-required, or native aria-describedby, so the
  // required/error state can only reach a screen reader through the accessible name. Never pair
  // this with aria-labelledby — the label element would replace the composed name on Android.
  const nameParts = [resolvedLabel];
  if (isRequired) nameParts.push(t('common.requiredLower'));
  if (error) nameParts.push(t('common.errorAnnouncement', { error }));
  const accessibleName = nameParts.join(', ');

  useEffect(() => {
    if (error && Platform.OS === 'ios') {
      AccessibilityInfo.announceForAccessibility(`${resolvedLabel}: ${error}`);
    }
  }, [error, resolvedLabel]);

  function setRefs(node: TextInput | null) {
    inputRef.current = node;
    if (typeof ref === 'function') ref(node);
    else if (ref) ref.current = node;
  }

  function handleMicPress() {
    inputRef.current?.focus();
    setIsDictationHintShown(true);
    AccessibilityInfo.announceForAccessibility(dictationHint);
  }

  function handleRevealToggle() {
    const isNextRevealed = !isPasswordRevealed;
    if (isRevealed === undefined) {
      setIsRevealedInternal(isNextRevealed);
    }
    onRevealToggle?.(isNextRevealed);
  }

  function renderTrailing() {
    if (isSecure) {
      return (
        <IconButton
          diameter={32}
          variant="filled"
          icon={
            <Icon
              name={isPasswordRevealed ? 'hide' : 'show'}
              size="md"
              className={TONE.secondary}
            />
          }
          label={isPasswordRevealed ? t('input.hidePassword') : t('input.showPassword')}
          hint={isPasswordRevealed ? t('input.hidePasswordHint') : t('input.showPasswordHint')}
          disabled={isDisabled}
          onPress={handleRevealToggle}
        />
      );
    }

    if (isSearch && value.length > 0 && !isDisabled) {
      return (
        <Pressable
          onPress={onClear}
          role="button"
          aria-label={t('input.clearSearch')}
          hitSlop={12}
          className="justify-center">
          <Text className={`type-label-sm ${TONE.secondary}`} maxFontSizeMultiplier={2}>
            {t('input.clear')}
          </Text>
        </Pressable>
      );
    }

    if (!isMicVisible || !profile?.dictation_enabled) {
      return null;
    }

    return (
      <IconButton
        diameter={32}
        variant="filled"
        icon={
          <Icon name="dictate" size="md" className={isDisabled ? TONE.disabled : TONE.primary} />
        }
        label={t('input.dictate', { label: resolvedLabel.toLowerCase() })}
        hint={t('input.dictateHint')}
        disabled={isDisabled}
        onPress={handleMicPress}
      />
    );
  }

  return (
    <View className={`${WIDTH[width]} ${className}`}>
      {!isSearch && !isLabelHidden ? (
        <View className="mb-1 flex-row items-center gap-2">
          <Text className={`type-label-lg ${LABEL_TONE[state]}`} maxFontSizeMultiplier={2}>
            {label}
          </Text>
          {isRequired ? (
            <Text
              className={`type-text-primary ${isDisabled ? TONE.disabled : TONE.secondary}`}
              maxFontSizeMultiplier={2}>
              {t('common.required')}
            </Text>
          ) : null}
        </View>
      ) : null}

      <View
        className={`${MIN_HEIGHT[variant]} flex-row gap-2 px-4 py-2 ${
          multiline ? 'items-start' : 'items-center'
        } ${CONTAINER[variant][state]}`}>
        {isSearch ? <Icon name="search" size="md" className={TONE.secondary} /> : null}

        <TextInput
          ref={setRefs}
          className={`flex-1 self-stretch p-0 ${VALUE_TONE[state]}`}
          style={[
            toValueTextStyle(valueVariant, !!profile?.large_text),
            multiline ? { minHeight: 96 } : null,
          ]}
          multiline={multiline}
          textAlignVertical={multiline ? 'top' : 'center'}
          value={value}
          onChangeText={onChangeText}
          onFocus={(e) => {
            setIsFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            setIsDictationHintShown(false);
            onBlur?.(e);
          }}
          onSubmitEditing={onSubmitEditing}
          onKeyPress={onKeyPress}
          editable={!isDisabled}
          focusable={!isDisabled}
          selectTextOnFocus={false}
          secureTextEntry={isSecure && !isPasswordRevealed}
          placeholderTextColor={placeholderColor}
          selectionColor={caretColor}
          role={isSearch ? 'searchbox' : undefined}
          aria-label={accessibleName}
          aria-disabled={isDisabled}
          accessibilityHint={helperText}
          {...rest}
        />

        {renderTrailing()}
        {trailingAccessory}
      </View>

      {hasError ? (
        <Text
          role="alert"
          aria-live="assertive"
          className={`type-text-primary mt-1 ${TONE.error}`}
          maxFontSizeMultiplier={2}>
          {error}
        </Text>
      ) : isDictationHintShown || helperText ? (
        <Text
          className={`type-text-secondary mt-1 ${isDisabled ? TONE.disabled : TONE.secondary}`}
          maxFontSizeMultiplier={2}>
          {isDictationHintShown ? dictationHint : helperText}
        </Text>
      ) : null}
    </View>
  );
}
