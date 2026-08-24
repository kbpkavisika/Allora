export interface Profile {
  id: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  sms_order_updates: boolean;
  preferred_carrier: string;
  leave_at_door_default: boolean;
  two_factor_enabled: boolean;
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
