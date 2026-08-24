import { useCallback, useEffect, useState } from 'react';

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

export function useProfile() {
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

  return {
    profile,
    addresses,
    isLoading,
    updateProfile,
    saveAddress,
    deleteAddress,
    refresh: load,
  };
}
