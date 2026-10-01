import * as Haptics from 'expo-haptics';
import { useEffect, useRef, useState } from 'react';
import type { TurboModule } from 'react-native';
import {
  DeviceEventEmitter,
  NativeModules,
  Platform,
  Pressable,
  Text,
  TextInput,
  TurboModuleRegistry,
  View,
} from 'react-native';

import { Button } from '@/components/ui/Button';
import { FormError } from '@/components/ui/FormError';
import { ReadAloudButton } from '@/components/payment/ReadAloudButton';
import { formatPaymentAuthenticationSpeech } from '@/components/payment/paymentSpeech';
import {
  requestPaymentOtp,
  verifyPaymentOtp,
  type PaymentOtpVerificationErrorCode,
} from '@/lib/payments/paymentOtp';

type NativeSmsRetrieverModule = TurboModule & {
  getAppHash: () => Promise<string>;
  startSMSListener: () => void;
  stopSMSListener: () => void;
};

function getNativeSmsRetriever(): NativeSmsRetrieverModule | null {
  if (Platform.OS !== 'android') return null;
  return (
    NativeModules.SMSRetriever ??
    TurboModuleRegistry.getEnforcing<NativeSmsRetrieverModule>('SMSRetriever')
  );
}

export interface PaymentAuthenticationProps {
  onVerified?: () => void;
  onCancel?: () => void;
}

export function PaymentAuthentication({
  onVerified,
  onCancel,
}: PaymentAuthenticationProps) {
  const [otp, setOtp] = useState<string[]>(['', '', '', '', '', '']);
  const [secondsRemaining, setSecondsRemaining] = useState(0);
  const [maskedPhone, setMaskedPhone] = useState<string | null>(null);
  const [isRequesting, setIsRequesting] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRefs = useRef<(TextInput | null)[]>([]);
  const maskedPhoneRef = useRef<string | null>(null);
  const verificationInProgressRef = useRef(false);
  const verifiedRef = useRef(false);
  const lastAutomaticallySubmittedCodeRef = useRef<string | null>(null);
  const smsRetrievedSubscriptionRef = useRef<{ remove: () => void } | null>(null);
  const smsErrorSubscriptionRef = useRef<{ remove: () => void } | null>(null);

  function stopSmsRetriever() {
    if (Platform.OS !== 'android') return;
    smsRetrievedSubscriptionRef.current?.remove();
    smsRetrievedSubscriptionRef.current = null;
    smsErrorSubscriptionRef.current?.remove();
    smsErrorSubscriptionRef.current = null;
    getNativeSmsRetriever()?.stopSMSListener();
  }

  function extractOtp(message: string): string | null {
    const sixDigitMatches = message.match(/\d+/g)?.filter((match) => match.length === 6) ?? [];
    return sixDigitMatches.length === 1 ? sixDigitMatches[0] : null;
  }

  async function startSmsRetriever(): Promise<boolean> {
    const nativeSmsRetriever = getNativeSmsRetriever();
    if (!nativeSmsRetriever) return false;

    stopSmsRetriever();

    try {
      const appHash = await nativeSmsRetriever.getAppHash();
      console.info('[PaymentOTP] SMS Retriever app hash', appHash);
      if (appHash !== 'H8Wm9X62u/o') {
        console.error('[PaymentOTP] SMS Retriever app hash mismatch', appHash);
        return false;
      }

      smsRetrievedSubscriptionRef.current = DeviceEventEmitter.addListener('onSMSRetrieved', (message: string) => {
        console.info('[PaymentOTP] SMS received');
        const code = extractOtp(message);
        if (!code) return;

        console.info('[PaymentOTP] extracted OTP');
        setOtp(code.split(''));
        console.info('[PaymentOTP] autofill submitting');
        void verifyCode(code, true);
      });
      smsErrorSubscriptionRef.current = DeviceEventEmitter.addListener('onSMSError', (smsError: { type?: string }) => {
        console.info('[PaymentOTP] SMS Retriever error', smsError.type ?? 'unknown');
      });
      nativeSmsRetriever.startSMSListener();
      console.info('[PaymentOTP] SMS Retriever started');
      return true;
    } catch {
      stopSmsRetriever();
      return false;
    }
  }

  useEffect(() => {
    if (secondsRemaining <= 0) return;
    const timer = setInterval(() => setSecondsRemaining((current) => Math.max(0, current - 1)), 1000);
    return () => clearInterval(timer);
  }, [secondsRemaining]);

  useEffect(() => stopSmsRetriever, []);

  async function requestCode() {
    if (isRequesting || isVerifying) return;

    setError(null);
    setOtp(['', '', '', '', '', '']);
    setIsVerified(false);
    verifiedRef.current = false;
    lastAutomaticallySubmittedCodeRef.current = null;
    setIsRequesting(true);
    console.info('[PaymentOTP] request started');

    try {
      const smsRetrieverStarted = await startSmsRetriever();
      if (!smsRetrieverStarted) {
        throw new Error('SMS Retriever is unavailable or the app hash does not match.');
      }
      const result = await requestPaymentOtp();
      maskedPhoneRef.current = result.maskedPhone;
      setMaskedPhone(result.maskedPhone);
      setSecondsRemaining(result.expiresInSeconds);
      console.info('[PaymentOTP] request succeeded');
      inputRefs.current[0]?.focus();
    } catch (requestError) {
      stopSmsRetriever();
      setError(requestError instanceof Error ? requestError.message : 'Unable to send verification code.');
    } finally {
      setIsRequesting(false);
    }
  }

  function verificationMessage(errorCode: PaymentOtpVerificationErrorCode): string {
    const messages: Record<PaymentOtpVerificationErrorCode, string> = {
      invalid_code: 'Incorrect verification code. Please check the code and try again.',
      expired: 'This verification code has expired.',
      too_many_attempts: 'Too many incorrect attempts. Request a new code.',
      not_found: 'No active verification code was found. Request a new code.',
      network: 'Unable to verify the code. Check your connection and try again.',
      unauthorized: 'Your session has expired. Please sign in again.',
    };

    return messages[errorCode] || 'Incorrect verification code. Please check the code and try again.';
  }

  async function verifyCode(code: string, automatic = false) {
    if (
      verificationInProgressRef.current ||
      verifiedRef.current ||
      isVerifying ||
      !maskedPhoneRef.current ||
      !/^\d{6}$/.test(code)
    ) {
      return;
    }

    if (automatic && lastAutomaticallySubmittedCodeRef.current === code) return;
    if (automatic) lastAutomaticallySubmittedCodeRef.current = code;

    setError(null);
    verificationInProgressRef.current = true;
    setIsVerifying(true);
    console.info('[PaymentOTP] verification started');

    try {
      const result = await verifyPaymentOtp(code);
      if (result.verified) {
        stopSmsRetriever();
        verifiedRef.current = true;
        setIsVerified(true);
        console.info('[PaymentOTP] verification succeeded');
        onVerified?.();
        return;
      }

      console.info('[PaymentOTP] verification failed', result.error);
      setError(verificationMessage(result.error));
    } catch {
      console.info('[PaymentOTP] verification failed', 'network');
      setError('Unable to verify the code. Check your connection and try again.');
    } finally {
      verificationInProgressRef.current = false;
      setIsVerifying(false);
    }
  }

  function handleChange(index: number, value: string) {
    const digits = value.replace(/\D/g, '');
    const nextDigits = [...otp];

    if (!digits) {
      nextDigits[index] = '';
    } else {
      digits.slice(0, 6 - index).split('').forEach((digit, offset) => {
        nextDigits[index + offset] = digit;
      });
    }

    setOtp(nextDigits);

    if (nextDigits.every(Boolean)) {
      void verifyCode(nextDigits.join(''), true);
      return;
    }

    if (digits && index < 5) inputRefs.current[Math.min(index + digits.length, 5)]?.focus();
  }

  async function handleResend() {
    await Haptics.selectionAsync();
    await requestCode();
  }

  function handleCancel() {
    stopSmsRetriever();
    onCancel?.();
  }

  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = String(secondsRemaining % 60).padStart(2, '0');
  const countdownLabel = `Verification code expires in ${minutes} minute${minutes === 1 ? '' : 's'} ${
    Number(seconds) === 1 ? 'second' : 'seconds'
  }.`;

  return (
    <View
      className="gap-5 rounded-12 border-1 border-border-strong bg-surface p-4">
      <View className="gap-2">
        <Text accessibilityRole="header" className="type-h2 text-primary" maxFontSizeMultiplier={2}>
          Verify your payment
        </Text>
        <Text className="type-text-primary text-secondary" maxFontSizeMultiplier={2}>
          Request a code, then enter the six-digit code sent to your phone. This screen does not read or store messages.
        </Text>
      </View>

      <ReadAloudButton text={formatPaymentAuthenticationSpeech(maskedPhone)} />

      {!maskedPhone ? (
        <Button label="Send Verification Code" loading={isRequesting} onPress={requestCode} />
      ) : (
        <Text className="type-text-primary text-secondary" maxFontSizeMultiplier={2}>
          Verification code sent to {maskedPhone}
        </Text>
      )}

      <View accessibilityLabel="Six-digit payment authentication code" className="flex-row gap-2">
        {Array.from({ length: 6 }, (_, index) => {
          const digit = otp[index];
          return (
            <TextInput
              key={index}
              ref={(input) => {
                inputRefs.current[index] = input;
              }}
              accessibilityLabel={`Digit ${index + 1} of 6, ${digit || 'empty'}`}
              accessibilityHint={`Enter digit ${index + 1} of 6 for payment authentication`}
              accessibilityRole="text"
              editable={Boolean(maskedPhone) && !isVerifying && !isVerified}
              autoComplete={index === 0 ? 'one-time-code' : 'off'}
              keyboardType="number-pad"
              maxLength={1}
              onChangeText={(value) => handleChange(index, value)}
              onKeyPress={({ nativeEvent }) => {
                if (nativeEvent.key === 'Backspace' && !digit && index > 0) {
                  inputRefs.current[index - 1]?.focus();
                }
              }}
              value={digit}
              className="min-h-control-lg flex-1 rounded-8 border-1.5 border-border-strong bg-surface px-1 text-center type-h2 text-primary"
            />
          );
        })}
      </View>

      <Text accessibilityLabel={countdownLabel} className="type-text-primary text-secondary" maxFontSizeMultiplier={2}>
        {maskedPhone ? `Code expires in ${minutes}:${seconds}.` : 'Code expires in 5 minutes.'}
      </Text>

      <FormError message={error} />

      {maskedPhone ? (
        <>
          <Button
            label="Verify Code"
            loading={isVerifying}
            disabled={isVerifying || isVerified || otp.some((digit) => !digit)}
            onPress={() => void verifyCode(otp.join(''))}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Resend payment authentication code"
            accessibilityState={{ disabled: isRequesting || isVerifying }}
            disabled={isRequesting || isVerifying}
            onPress={handleResend}
            className="min-h-tap justify-center">
            <Text className="type-label text-primary">Resend code</Text>
          </Pressable>
        </>
      ) : null}

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Cancel payment authentication"
        onPress={handleCancel}
        className="min-h-tap justify-center">
        <Text className="type-label text-secondary">Cancel</Text>
      </Pressable>
    </View>
  );
}
