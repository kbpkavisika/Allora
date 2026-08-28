import type { SellerOrder } from '@/lib/orders';

// Placeholder fixture until the buyer-side checkout lands the `orders` table this shape mirrors.
export const mockSellerOrders: SellerOrder[] = [
  {
    id: '1',
    shop_id: 'shop',
    order_number: '#1520',
    buyer_name: 'Nadeesha K.',
    status: 'new',
    total: 2300,
    placed_at: new Date().toISOString(),
    items: [
      { product_id: 'p1', product_name: 'Teak serving tray', quantity: 1, unit_price: 2300 },
    ],
  },
  {
    id: '2',
    shop_id: 'shop',
    order_number: '#1519',
    buyer_name: 'Ruwan P.',
    status: 'new',
    total: 1900,
    placed_at: new Date().toISOString(),
    items: [
      { product_id: 'p2', product_name: 'Handwoven basket', quantity: 2, unit_price: 950 },
    ],
  },
  {
    id: '3',
    shop_id: 'shop',
    order_number: '#1518',
    buyer_name: 'Chamari D.',
    status: 'processing',
    total: 3200,
    placed_at: '2026-08-26T09:15:00.000Z',
    items: [
      { product_id: 'p3', product_name: 'Batik table runner', quantity: 1, unit_price: 3200 },
    ],
  },
  {
    id: '4',
    shop_id: 'shop',
    order_number: '#1512',
    buyer_name: 'Sanduni W.',
    status: 'completed',
    total: 1450,
    placed_at: '2026-08-20T14:40:00.000Z',
    items: [
      { product_id: 'p4', product_name: 'Coconut shell bowl set', quantity: 1, unit_price: 1450 },
    ],
  },
];
