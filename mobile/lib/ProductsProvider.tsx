import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';

import { uploadProductPhotos } from '@/lib/photoUpload';
import type { Product } from '@/lib/products';
import { useShop } from '@/lib/ShopProvider';
import { supabase } from '@/lib/supabase';

export interface ProductInput {
  name: string;
  description: string;
  price: number;
  stock_quantity: number;
  category: string;
  photos: string[];
}

export interface StockUpdate {
  id: string;
  stock_quantity: number;
}

export interface ProductsContextValue {
  products: Product[];
  isLoading: boolean;
  createProduct: (input: ProductInput) => Promise<{ error: unknown }>;
  updateProduct: (id: string, input: ProductInput) => Promise<{ error: unknown }>;
  updateStock: (updates: StockUpdate[]) => Promise<{ error: unknown }>;
  refresh: () => Promise<void>;
}

export interface ProductsProviderProps {
  children: ReactNode;
}

const ProductsContext = createContext<ProductsContextValue | null>(null);

export function ProductsProvider({ children }: ProductsProviderProps) {
  const { shop } = useShop();

  const shopId = shop?.id;

  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    if (!shopId) {
      setProducts([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    const { data } = await supabase
      .from('products')
      .select('*')
      .eq('shop_id', shopId)
      .order('created_at', { ascending: false });

    setProducts(data ?? []);
    setIsLoading(false);
  }, [shopId]);

  useEffect(() => {
    load();
  }, [load]);

  async function createProduct(input: ProductInput) {
    if (!shopId) {
      return { error: new Error('No shop to add a product to.') };
    }

    try {
      const photos = await uploadProductPhotos(input.photos);

      const { data, error } = await supabase
        .from('products')
        .insert({ ...input, photos, shop_id: shopId })
        .select()
        .single();

      if (error) {
        return { error };
      }

      setProducts((current) => [data, ...current]);
      return { error: null };
    } catch (error) {
      return { error };
    }
  }

  async function updateProduct(id: string, input: ProductInput) {
    try {
      const photos = await uploadProductPhotos(input.photos);

      const { data, error } = await supabase
        .from('products')
        .update({ ...input, photos })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        return { error };
      }

      setProducts((current) => current.map((item) => (item.id === id ? data : item)));
      return { error: null };
    } catch (error) {
      return { error };
    }
  }

  // Stock-only writes skip updateProduct so a bulk save never rewrites unrelated columns or
  // walks the photo upload path for rows whose images have not changed.
  async function updateStock(updates: StockUpdate[]) {
    if (updates.length === 0) {
      return { error: null };
    }

    const results = await Promise.all(
      updates.map(({ id, stock_quantity }) =>
        supabase.from('products').update({ stock_quantity }).eq('id', id)
      )
    );

    const failed = results.find((result) => result.error);

    if (failed?.error) {
      await load();
      return { error: failed.error };
    }

    const byId = new Map(updates.map((update) => [update.id, update.stock_quantity]));

    setProducts((current) =>
      current.map((product) =>
        byId.has(product.id)
          ? { ...product, stock_quantity: byId.get(product.id)! }
          : product
      )
    );

    return { error: null };
  }

  const value: ProductsContextValue = {
    products,
    isLoading,
    createProduct,
    updateProduct,
    updateStock,
    refresh: load,
  };

  return <ProductsContext.Provider value={value}>{children}</ProductsContext.Provider>;
}

export function useProducts(): ProductsContextValue {
  const productsState = useContext(ProductsContext);
  if (!productsState) {
    throw new Error('useProducts must be used inside <ProductsProvider>.');
  }
  return productsState;
}
