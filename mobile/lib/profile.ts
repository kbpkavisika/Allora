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

export const ACCESSIBILITY_FEATURES = [
  {
    key: 'large_text',
    title: 'Large text',
    description: 'Scales every label and price up one step.',
  },
  {
    key: 'high_contrast',
    title: 'High contrast',
    description: 'Stronger borders and darker body text.',
  },
  {
    key: 'dictation_enabled',
    title: 'Dictation',
    description: 'Speak into any field instead of typing.',
  },
  {
    key: 'screen_reader_support',
    title: 'Screen reader support',
    description: 'Extra spoken labels and reading order cues.',
  },
  {
    key: 'reduce_motion',
    title: 'Reduce motion',
    description: 'Removes sliding and fading transitions.',
  },
] as const satisfies readonly { key: keyof Profile; title: string; description: string }[];

export function enabledAccessibilityFeatures(profile: Profile): string {
  const on = ACCESSIBILITY_FEATURES.filter((feature) => profile[feature.key]).map(
    (feature) => feature.title
  );
  return on.length > 0 ? on.join(', ') : 'None yet';
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
  return new Date(createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

export function nextCarrier(current: string): string {
  const index = CARRIER_OPTIONS.indexOf(current as (typeof CARRIER_OPTIONS)[number]);
  return CARRIER_OPTIONS[(index + 1) % CARRIER_OPTIONS.length];
}
