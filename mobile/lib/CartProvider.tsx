import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { useAuth } from '@/lib/AuthProvider';
import { cartItemCount, cartSubtotal, type CartLine } from '@/lib/cart';
import type { Product } from '@/lib/products';
import { supabase } from '@/lib/supabase';

export type { CartLine } from '@/lib/cart';

export interface CartContextValue {
  lines: CartLine[];
  itemCount: number;
  subtotal: number;
  isLoading: boolean;
  addItem: (productId: string, quantity?: number) => Promise<{ error: unknown }>;
  updateQuantity: (productId: string, quantity: number) => Promise<{ error: unknown }>;
  removeItem: (productId: string) => Promise<{ error: unknown }>;
  clear: () => Promise<{ error: unknown }>;
  refresh: () => Promise<void>;
}

export interface CartProviderProps {
  children: ReactNode;
}

interface CartItemRow {
  quantity: number;
  product: Product | null;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: CartProviderProps) {
  const { session } = useAuth();
  const userId = session?.user.id;

  const [lines, setLines] = useState<CartLine[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    if (!userId) {
      setLines([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    const { data } = await supabase
      .from('cart_items')
      .select('quantity, product:products(*)')
      .eq('user_id', userId)
      .order('created_at');

    const rows = (data ?? []) as unknown as CartItemRow[];
    setLines(
      rows
        .filter((row): row is CartItemRow & { product: Product } => row.product !== null)
        .map((row) => ({ product: row.product, quantity: row.quantity }))
    );
    setIsLoading(false);
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  const addItem = useCallback(
    async (productId: string, quantity = 1) => {
      if (!userId) return { error: new Error('Not signed in.') };

      const existing = lines.find((line) => line.product.id === productId);
      const nextQuantity = (existing?.quantity ?? 0) + quantity;

      const { error } = await supabase
        .from('cart_items')
        .upsert(
          { user_id: userId, product_id: productId, quantity: nextQuantity },
          { onConflict: 'user_id,product_id' }
        );

      if (!error) await load();
      return { error };
    },
    [userId, lines, load]
  );

  const updateQuantity = useCallback(
    async (productId: string, quantity: number) => {
      if (!userId) return { error: new Error('Not signed in.') };

      const { error } =
        quantity <= 0
          ? await supabase
              .from('cart_items')
              .delete()
              .eq('user_id', userId)
              .eq('product_id', productId)
          : await supabase
              .from('cart_items')
              .update({ quantity })
              .eq('user_id', userId)
              .eq('product_id', productId);

      if (!error) await load();
      return { error };
    },
    [userId, load]
  );

  const removeItem = useCallback(
    (productId: string) => updateQuantity(productId, 0),
    [updateQuantity]
  );

  const clear = useCallback(async () => {
    if (!userId) return { error: new Error('Not signed in.') };

    const { error } = await supabase.from('cart_items').delete().eq('user_id', userId);
    if (!error) setLines([]);
    return { error };
  }, [userId]);

  const value = useMemo<CartContextValue>(
    () => ({
      lines,
      itemCount: cartItemCount(lines),
      subtotal: cartSubtotal(lines),
      isLoading,
      addItem,
      updateQuantity,
      removeItem,
      clear,
      refresh: load,
    }),
    [lines, isLoading, addItem, updateQuantity, removeItem, clear, load]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const cart = useContext(CartContext);
  if (!cart) {
    throw new Error('useCart must be used inside <CartProvider>.');
  }
  return cart;
}
