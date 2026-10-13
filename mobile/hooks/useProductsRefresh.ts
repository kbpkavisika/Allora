import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import { useProducts } from '@/lib/ProductsProvider';

export function useProductsRefresh() {
  const { refresh } = useProducts();
  const [isRefreshing, setIsRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const pullToRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await refresh();
    setIsRefreshing(false);
  }, [refresh]);

  return { isRefreshing, pullToRefresh };
}
