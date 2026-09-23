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
import {
  nextDeliveryStatus,
  type Delivery,
  type DeliveryStatus,
} from '@/lib/deliveries';
import {
  nextStatus,
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
  advanceStatus: (orderId: string) => Promise<{ error: unknown }>;
  updateDelivery: (input: DeliveryInput) => Promise<{ error: unknown }>;
  advanceDelivery: (orderId: string) => Promise<{ error: unknown }>;
  submitReturn: (input: ReturnInput) => Promise<{ error: unknown }>;
  refresh: () => Promise<void>;
}

export interface OrdersProviderProps {
  children: ReactNode;
}

const OrdersContext = createContext<OrdersContextValue | null>(null);

function withDelivery(orders: Order[], orderId: string, delivery: Delivery): Order[] {
  return orders.map((order) => (order.id === orderId ? { ...order, delivery } : order));
}

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

      const byShop = new Map<string, CartLine[]>();
      for (const line of lines) {
        const key = line.product.shop_id;
        byShop.set(key, [...(byShop.get(key) ?? []), line]);
      }

      const created: Order[] = [];

      for (const [shopKey, shopLines] of byShop) {
        const subtotal = shopLines.reduce(
          (sum, line) => sum + line.product.price * line.quantity,
          0
        );

        const { data: order, error: orderError } = await supabase
          .from('orders')
          .insert({
            buyer_id: userId,
            shop_id: shopKey,
            status: 'new',
            payment_method: paymentMethod,
            payment_status: paymentStatus,
            payment_reference: paymentReference ?? null,
            subtotal,
            total: subtotal,
            ...addressSnapshot(address, profile?.full_name ?? null),
          })
          .select()
          .single();

        if (orderError || !order) {
          await load();
          return { orders: created, error: orderError ?? new Error('Could not place the order.') };
        }

        const { error: itemsError } = await supabase.from('order_items').insert(
          shopLines.map((line) => ({
            order_id: order.id,
            product_id: line.product.id,
            product_name: line.product.name,
            product_photo: line.product.photos[0] ?? null,
            unit_price: line.product.price,
            quantity: line.quantity,
          }))
        );

        if (itemsError) {
          await load();
          return { orders: created, error: itemsError };
        }

        created.push({ ...(order as unknown as Order), items: [], delivery: null });
      }

      await load();
      return { orders: created, error: null };
    },
    [userId, profile?.full_name, load]
  );

  const advanceStatus = useCallback(
    async (orderId: string) => {
      const order = orders.find((item) => item.id === orderId);
      if (!order) return { error: new Error('Order not found.') };

      const next = nextStatus(order.status);
      if (!next) return { error: null };

      const { error } = await supabase
        .from('orders')
        .update({ status: next })
        .eq('id', orderId);

      if (!error) {
        setOrders((current) =>
          current.map((item) => (item.id === orderId ? { ...item, status: next } : item))
        );
      }
      return { error };
    },
    [orders]
  );

  const updateDelivery = useCallback(
    async ({ orderId, status, courierName, trackingNumber }: DeliveryInput) => {
      const { data, error } = await supabase
        .from('deliveries')
        .update({
          status,
          courier_name: courierName,
          tracking_number: trackingNumber,
          delivered_at: status === 'delivered' ? new Date().toISOString() : null,
        })
        .eq('order_id', orderId)
        .select()
        .single();

      if (!error && data) {
        setOrders((current) => withDelivery(current, orderId, data as unknown as Delivery));
      }

      return { error };
    },
    []
  );

  const advanceDelivery = useCallback(
    async (orderId: string) => {
      const order = orders.find((item) => item.id === orderId);
      if (!order) return { error: new Error('Order not found.') };

      const next = nextDeliveryStatus(order.delivery?.status ?? 'pending');
      if (!next) return { error: null };

      const { data, error } = await supabase
        .from('deliveries')
        .update({
          status: next,
          delivered_at: next === 'delivered' ? new Date().toISOString() : null,
        })
        .eq('order_id', orderId)
        .select()
        .single();

      if (!error && data) {
        setOrders((current) => withDelivery(current, orderId, data as unknown as Delivery));
      }

      return { error };
    },
    [orders]
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
      advanceStatus,
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
      advanceStatus,
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
