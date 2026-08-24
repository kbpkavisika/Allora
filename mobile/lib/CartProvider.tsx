import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

import { mockSellerProducts, type SellerProduct } from '@/lib/mockProducts';

export interface CartLineItem {
  product: SellerProduct;
  quantity: number;
}

export interface CartContextValue {
  lineItems: CartLineItem[];
  itemCount: number;
  subtotal: number;
  addItem: (productId: string, quantity?: number) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void;
}

export interface CartProviderProps {
  children: ReactNode;
}

const CartContext = createContext<CartContextValue | null>(null);

// Seeded so the cart is demoable before a buyer product-browse screen exists;
// remove once add-to-cart is wired up from a real product detail screen.
const INITIAL_QUANTITIES: Record<string, number> = { '1': 2, '3': 1 };

export function CartProvider({ children }: CartProviderProps) {
  const [quantities, setQuantities] = useState<Record<string, number>>(INITIAL_QUANTITIES);

  function addItem(productId: string, quantity = 1) {
    const product = mockSellerProducts.find((item) => item.id === productId);
    if (!product) {
      return;
    }
    setQuantities((current) => ({ ...current, [productId]: (current[productId] ?? 0) + quantity }));
  }

  function updateQuantity(productId: string, quantity: number) {
    setQuantities((current) => {
      if (quantity <= 0) {
        const { [productId]: _removed, ...rest } = current;
        return rest;
      }
      return { ...current, [productId]: quantity };
    });
  }

  function removeItem(productId: string) {
    setQuantities((current) => {
      const { [productId]: _removed, ...rest } = current;
      return rest;
    });
  }

  const lineItems = useMemo<CartLineItem[]>(
    () =>
      Object.entries(quantities)
        .map(([productId, quantity]) => {
          const product = mockSellerProducts.find((item) => item.id === productId);
          return product ? { product, quantity } : null;
        })
        .filter((item): item is CartLineItem => item !== null),
    [quantities]
  );

  const itemCount = lineItems.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = lineItems.reduce(
    (sum, item) => sum + Number(item.product.price) * item.quantity,
    0
  );

  const value: CartContextValue = {
    lineItems,
    itemCount,
    subtotal,
    addItem,
    updateQuantity,
    removeItem,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const cart = useContext(CartContext);
  if (!cart) {
    throw new Error('useCart must be used inside <CartProvider>.');
  }
  return cart;
}
