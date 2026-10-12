import { isAuthApiError, type AuthError } from '@supabase/supabase-js';
import i18n from '@/lib/i18n';

export function getAuthErrorMessage(error: AuthError): string {
  const fallback = i18n.t('errors.auth.fallback');

  if (isAuthApiError(error) && error.code) {
    return i18n.t(`errors.auth.${error.code}`, { defaultValue: fallback });
  }

  return fallback;
}
