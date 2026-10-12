import i18n, { formatDate } from '@/lib/i18n';

export type UserRole = 'user' | 'seller';

export interface Profile {
  id: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  sms_order_updates: boolean;
  preferred_carrier: string;
  leave_at_door_default: boolean;
  two_factor_enabled: boolean;
  role: UserRole | null;
  large_text: boolean;
  high_contrast: boolean;
  dictation_enabled: boolean;
  screen_reader_support: boolean;
  reduce_motion: boolean;
  message_notifications: boolean;
  created_at: string;
}

export interface Address {
  id: string;
  user_id: string;
  label: string;
  line1: string;
  line2: string | null;
  city: string;
  region: string;
  postal_code: string;
  country: string;
  delivery_note: string | null;
  is_default: boolean;
  created_at: string;
}

export const CARRIER_OPTIONS = ['Any', 'Standard', 'Express'] as const;

export const PROVINCE_OPTIONS = [
  'AB',
  'BC',
  'MB',
  'NB',
  'NL',
  'NS',
  'NT',
  'NU',
  'ON',
  'PE',
  'QC',
  'SK',
  'YT',
] as const;

export const COUNTRY_OPTIONS = ['Canada', 'United States'] as const;

export const ADDRESS_LABELS = ['Home', 'Work', 'Other'] as const;

export const ACCESSIBILITY_FEATURES = [
  'large_text',
  'high_contrast',
  'dictation_enabled',
  'screen_reader_support',
  'reduce_motion',
] as const satisfies readonly (keyof Profile)[];

export function enabledAccessibilityFeatures(profile: Profile): string {
  const on = ACCESSIBILITY_FEATURES.filter((key) => profile[key]).map((key) =>
    i18n.t(`accessibility.features.${key}.title`)
  );
  return on.length > 0 ? on.join(', ') : i18n.t('accessibility.noneYet');
}

export function formatAddressLines(address: Address): string[] {
  return [
    [address.line1, address.line2].filter(Boolean).join(', '),
    `${address.city}, ${address.region} ${address.postal_code}`,
    address.country,
  ];
}

export function initials(name: string | null, email: string | null | undefined): string {
  const trimmed = name?.trim();
  if (trimmed) {
    return trimmed
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('');
  }
  return email?.[0]?.toUpperCase() ?? '?';
}

export function memberSince(createdAt: string): string {
  return formatDate(createdAt, { month: 'short', year: 'numeric' });
}

export function nextCarrier(current: string): string {
  const index = CARRIER_OPTIONS.indexOf(current as (typeof CARRIER_OPTIONS)[number]);
  return CARRIER_OPTIONS[(index + 1) % CARRIER_OPTIONS.length];
}
