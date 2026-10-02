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
import { cartItemCount, CartStockLimitError, cartSubtotal, type CartLine } from '@/lib/cart';
import type { Product } from '@/lib/products';
import { supabase } from '@/lib/supabase';

export type { CartLine } from '@/lib/cart';

export interface CartTotals {
  itemCount: number;
  subtotal: number;
}

export interface CartContextValue {
  lines: CartLine[];
  itemCount: number;
  subtotal: number;
  isLoading: boolean;
  addItem: (
    productId: string,
    quantity?: number
  ) => Promise<{ error: unknown; cart?: CartTotals }>;
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

  const load = useCallback(async (): Promise<CartLine[]> => {
    if (!userId) {
      setLines([]);
      setIsLoading(false);
      return [];
    }

    setIsLoading(true);

    const { data } = await supabase
      .from('cart_items')
      .select('quantity, product:products(*)')
      .eq('user_id', userId)
      .order('created_at');

    const rows = (data ?? []) as unknown as CartItemRow[];
    const next = rows
      .filter((row): row is CartItemRow & { product: Product } => row.product !== null)
      .map((row) => ({ product: row.product, quantity: row.quantity }));
    setLines(next);
    setIsLoading(false);
    return next;
  }, [userId]);

  const refresh = useCallback(async () => {
    await load();
  }, [load]);

  useEffect(() => {
    load();
  }, [load]);

  const addItem = useCallback(
    async (productId: string, quantity = 1) => {
      if (!userId) return { error: new Error('Not signed in.') };

      const { data: product, error: stockError } = await supabase
        .from('products')
        .select('stock_quantity')
        .eq('id', productId)
        .single();
      if (stockError) return { error: stockError };

      const existing = lines.find((line) => line.product.id === productId);
      const nextQuantity = (existing?.quantity ?? 0) + quantity;

      if (nextQuantity > product.stock_quantity) {
        return { error: new CartStockLimitError(product.stock_quantity) };
      }

      const { error } = await supabase
        .from('cart_items')
        .upsert(
          { user_id: userId, product_id: productId, quantity: nextQuantity },
          { onConflict: 'user_id,product_id' }
        );

      if (error) return { error };

      const next = await load();
      return { error: null, cart: { itemCount: cartItemCount(next), subtotal: cartSubtotal(next) } };
    },
    [userId, lines, load]
  );

  const updateQuantity = useCallback(
    async (productId: string, quantity: number) => {
      if (!userId) return { error: new Error('Not signed in.') };

      const stock = lines.find((line) => line.product.id === productId)?.product.stock_quantity;
      if (stock !== undefined && quantity > 0 && quantity > stock) {
        return { error: new CartStockLimitError(stock) };
      }

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
    [userId, lines, load]
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
      refresh,
    }),
    [lines, isLoading, addItem, updateQuantity, removeItem, clear, refresh]
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
