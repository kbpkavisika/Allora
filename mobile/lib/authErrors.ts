import { isAuthApiError, type AuthError } from '@supabase/supabase-js';

const MESSAGES: Record<string, string> = {
  invalid_credentials: 'That email and password do not match. Check both and try again.',
  user_already_exists: 'An account already exists for this email. Log in instead.',
  email_exists: 'An account already exists for this email. Log in instead.',
  weak_password: 'Choose a stronger password with at least 6 characters.',
  email_address_invalid: 'That email address cannot be used. Try a different one.',
  email_not_confirmed: 'Confirm your email address before logging in.',
  over_request_rate_limit: 'Too many attempts. Wait a moment and try again.',
  over_email_send_rate_limit: 'Too many emails sent. Wait a moment and try again.',
  signup_disabled: 'New accounts are not being accepted right now.',
  validation_failed: 'Check the details you entered and try again.',
};

const FALLBACK = 'Something went wrong. Check your connection and try again.';

export function getAuthErrorMessage(error: AuthError): string {
  if (isAuthApiError(error) && error.code) {
    return MESSAGES[error.code] ?? FALLBACK;
  }

  return FALLBACK;
}
