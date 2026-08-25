import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';

import { useAuth } from '@/lib/AuthProvider';
import type { Address, Profile } from '@/lib/profile';
import { supabase } from '@/lib/supabase';

export interface ProfileUpdateInput {
  full_name?: string | null;
  phone?: string | null;
  sms_order_updates?: boolean;
  preferred_carrier?: string;
  leave_at_door_default?: boolean;
  two_factor_enabled?: boolean;
  role?: Profile['role'];
  large_text?: boolean;
  high_contrast?: boolean;
  dictation_enabled?: boolean;
  screen_reader_support?: boolean;
  reduce_motion?: boolean;
}

export interface AddressInput {
  label: string;
  line1: string;
  line2: string | null;
  city: string;
  region: string;
  postal_code: string;
  country: string;
  delivery_note: string | null;
  is_default: boolean;
}

export interface ProfileContextValue {
  profile: Profile | null;
  addresses: Address[];
  isLoading: boolean;
  updateProfile: (patch: ProfileUpdateInput) => Promise<{ error: unknown }>;
  saveAddress: (input: AddressInput, id?: string) => Promise<{ error: unknown }>;
  deleteAddress: (id: string) => Promise<{ error: unknown }>;
  refresh: () => Promise<void>;
}

export interface ProfileProviderProps {
  children: ReactNode;
}

const ProfileContext = createContext<ProfileContextValue | null>(null);

export function ProfileProvider({ children }: ProfileProviderProps) {
  const { session } = useAuth();
  const userId = session?.user.id;

  const [profile, setProfile] = useState<Profile | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    if (!userId) {
      setProfile(null);
      setAddresses([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    const [profileResult, addressesResult] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', userId).single(),
      supabase.from('addresses').select('*').eq('user_id', userId).order('created_at'),
    ]);

    setProfile(profileResult.data ?? null);
    setAddresses(addressesResult.data ?? []);
    setIsLoading(false);
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  async function updateProfile(patch: ProfileUpdateInput) {
    if (!userId) return { error: new Error('Not signed in.') };

    const { data, error } = await supabase
      .from('profiles')
      .update(patch)
      .eq('id', userId)
      .select()
      .single();

    if (!error) setProfile(data);
    return { error };
  }

  async function saveAddress(input: AddressInput, id?: string) {
    if (!userId) return { error: new Error('Not signed in.') };

    if (input.is_default) {
      await supabase.from('addresses').update({ is_default: false }).eq('user_id', userId);
    }

    const { error } = id
      ? await supabase.from('addresses').update(input).eq('id', id)
      : await supabase.from('addresses').insert({ ...input, user_id: userId });

    if (!error) await load();
    return { error };
  }

  async function deleteAddress(id: string) {
    const { error } = await supabase.from('addresses').delete().eq('id', id);
    if (!error) setAddresses((current) => current.filter((address) => address.id !== id));
    return { error };
  }

  const value: ProfileContextValue = {
    profile,
    addresses,
    isLoading,
    updateProfile,
    saveAddress,
    deleteAddress,
    refresh: load,
  };

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

export function useProfile(): ProfileContextValue {
  const profileState = useContext(ProfileContext);
  if (!profileState) {
    throw new Error('useProfile must be used inside <ProfileProvider>.');
  }
  return profileState;
}
