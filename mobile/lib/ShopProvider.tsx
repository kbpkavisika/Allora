import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';

import { useAuth } from '@/lib/AuthProvider';
import type { Shop } from '@/lib/shop';
import { supabase } from '@/lib/supabase';

export interface ShopInput {
  name: string;
  category: string;
  city: string;
  phone: string;
  pickup_enabled: boolean;
  delivery_enabled: boolean;
  photo_url: string | null;
}

export interface ShopContextValue {
  shop: Shop | null;
  isLoading: boolean;
  saveShop: (input: ShopInput) => Promise<{ error: unknown }>;
  refresh: () => Promise<void>;
}

export interface ShopProviderProps {
  children: ReactNode;
}

const ShopContext = createContext<ShopContextValue | null>(null);

export function ShopProvider({ children }: ShopProviderProps) {
  const { session } = useAuth();
  const userId = session?.user.id;

  const [shop, setShop] = useState<Shop | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    if (!userId) {
      setShop(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    const { data } = await supabase
      .from('shops')
      .select('*')
      .eq('owner_id', userId)
      .maybeSingle();

    setShop(data ?? null);
    setIsLoading(false);
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  async function saveShop(input: ShopInput) {
    if (!userId) return { error: new Error('Not signed in.') };

    const { data, error } = shop
      ? await supabase.from('shops').update(input).eq('id', shop.id).select().single()
      : await supabase
          .from('shops')
          .insert({ ...input, owner_id: userId })
          .select()
          .single();

    if (!error) setShop(data);
    return { error };
  }

  const value: ShopContextValue = { shop, isLoading, saveShop, refresh: load };

  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>;
}

export function useShop(): ShopContextValue {
  const shopState = useContext(ShopContext);
  if (!shopState) {
    throw new Error('useShop must be used inside <ShopProvider>.');
  }
  return shopState;
}
