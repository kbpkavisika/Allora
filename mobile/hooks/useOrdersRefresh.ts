import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import { useOrders } from '@/lib/OrdersProvider';

export function useOrdersRefresh() {
  const { refresh } = useOrders();
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
