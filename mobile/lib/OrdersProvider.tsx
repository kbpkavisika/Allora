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
import type { CartLine } from '@/lib/cart';
import { nextDeliveryStatus, type DeliveryStatus } from '@/lib/deliveries';
import {
  type Order,
  type PaymentMethod,
  type PaymentStatus,
  type ReturnReason,
} from '@/lib/orders';
import type { Address } from '@/lib/profile';
import { useProfile } from '@/lib/ProfileProvider';
import { useShop } from '@/lib/ShopProvider';
import { supabase } from '@/lib/supabase';

export interface PlaceOrderInput {
  lines: CartLine[];
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  paymentReference?: string | null;
  address: Address | null;
}

export interface DeliveryInput {
  orderId: string;
  status: DeliveryStatus;
  courierName: string;
  trackingNumber: string;
}

export interface ReturnInput {
  orderId: string;
  reason: ReturnReason;
  details?: string;
}

export interface OrdersContextValue {
  orders: Order[];
  isLoading: boolean;
  getOrder: (id: string) => Order | undefined;
  placeOrder: (input: PlaceOrderInput) => Promise<{ orders: Order[]; error: unknown }>;
  updateDelivery: (input: DeliveryInput) => Promise<{ error: unknown }>;
  advanceDelivery: (orderId: string) => Promise<{ error: unknown }>;
  submitReturn: (input: ReturnInput) => Promise<{ error: unknown }>;
  refresh: () => Promise<void>;
}

export interface OrdersProviderProps {
  children: ReactNode;
}

const OrdersContext = createContext<OrdersContextValue | null>(null);

function addressSnapshot(address: Address | null, name: string | null) {
  return {
    ship_name: name,
    ship_line1: address?.line1 ?? null,
    ship_line2: address?.line2 ?? null,
    ship_city: address?.city ?? null,
    ship_region: address?.region ?? null,
    ship_postal_code: address?.postal_code ?? null,
    ship_country: address?.country ?? null,
    ship_note: address?.delivery_note ?? null,
  };
}

export function OrdersProvider({ children }: OrdersProviderProps) {
  const { session } = useAuth();
  const { profile } = useProfile();
  const { shop } = useShop();

  const userId = session?.user.id;
  const isSeller = profile?.role === 'seller';
  const shopId = shop?.id;

  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    if (!userId || (isSeller && !shopId)) {
      setOrders([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    const query = supabase
      .from('orders')
      .select('*, items:order_items(*), delivery:deliveries(*)')
      .order('placed_at', { ascending: false });

    const { data } = isSeller
      ? await query.eq('shop_id', shopId!)
      : await query.eq('buyer_id', userId);

    setOrders((data ?? []) as unknown as Order[]);
    setIsLoading(false);
  }, [userId, isSeller, shopId]);

  useEffect(() => {
    load();
  }, [load]);

  const getOrder = useCallback(
    (id: string) => orders.find((order) => order.id === id),
    [orders]
  );

  const placeOrder = useCallback(
    async ({ lines, paymentMethod, paymentStatus, paymentReference, address }: PlaceOrderInput) => {
      if (!userId) return { orders: [], error: new Error('Not signed in.') };
      if (lines.length === 0) return { orders: [], error: new Error('Your cart is empty.') };

      const { data, error } = await supabase.rpc('place_order', {
        p_items: lines.map((line) => ({ product_id: line.product.id, quantity: line.quantity })),
        p_payment_method: paymentMethod,
        p_payment_status: paymentStatus,
        p_payment_reference: paymentReference ?? null,
        p_shipping: addressSnapshot(address, profile?.full_name ?? null),
      });

      await load();

      if (error) return { orders: [], error };

      const created = ((data ?? []) as Omit<Order, 'items' | 'delivery'>[]).map((order) => ({
        ...order,
        items: [],
        delivery: null,
      }));
      return { orders: created, error: null };
    },
    [userId, profile?.full_name, load]
  );

  const updateDelivery = useCallback(
    async ({ orderId, status, courierName, trackingNumber }: DeliveryInput) => {
      const { error } = await supabase
        .from('deliveries')
        .update({
          status,
          courier_name: courierName,
          tracking_number: trackingNumber,
          delivered_at: status === 'delivered' ? new Date().toISOString() : null,
        })
        .eq('order_id', orderId);

      if (!error) await load();

      return { error };
    },
    [load]
  );

  const advanceDelivery = useCallback(
    async (orderId: string) => {
      const order = orders.find((item) => item.id === orderId);
      if (!order) return { error: new Error('Order not found.') };

      const next = nextDeliveryStatus(order.delivery?.status ?? 'pending');
      if (!next) return { error: null };

      const { error } = await supabase
        .from('deliveries')
        .update({
          status: next,
          delivered_at: next === 'delivered' ? new Date().toISOString() : null,
        })
        .eq('order_id', orderId);

      if (!error) await load();

      return { error };
    },
    [orders, load]
  );

  const submitReturn = useCallback(
    async ({ orderId, reason, details }: ReturnInput) => {
      if (!userId) return { error: new Error('Not signed in.') };

      const { error } = await supabase.from('order_returns').insert({
        order_id: orderId,
        buyer_id: userId,
        reason,
        details: details?.trim() ? details.trim() : null,
      });

      return { error };
    },
    [userId]
  );

  const value = useMemo<OrdersContextValue>(
    () => ({
      orders,
      isLoading,
      getOrder,
      placeOrder,
      updateDelivery,
      advanceDelivery,
      submitReturn,
      refresh: load,
    }),
    [
      orders,
      isLoading,
      getOrder,
      placeOrder,
      updateDelivery,
      advanceDelivery,
      submitReturn,
      load,
    ]
  );

  return <OrdersContext.Provider value={value}>{children}</OrdersContext.Provider>;
}

export function useOrders(): OrdersContextValue {
  const ordersState = useContext(OrdersContext);
  if (!ordersState) {
    throw new Error('useOrders must be used inside <OrdersProvider>.');
  }
  return ordersState;
}
