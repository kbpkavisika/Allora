import type { BadgeVariant } from '@/components/ui/Badge';

export interface Product {
  id: string;
  shop_id: string;
  name: string;
  description: string;
  price: number;
  stock_quantity: number;
  category: string;
  photos: string[];
  created_at: string;
  updated_at: string;
}

export interface StockStatus {
  label: string;
  variant: BadgeVariant;
}

const LOW_STOCK_THRESHOLD = 10;

export function getStockStatus(stockQuantity: string | number): StockStatus {
  const quantity = Number(stockQuantity);

  if (quantity <= 0) {
    return { label: 'Sold out', variant: 'neutral' };
  }

  if (quantity <= LOW_STOCK_THRESHOLD) {
    return { label: `Low stock · ${quantity} left`, variant: 'warning' };
  }

  return { label: `${quantity} in stock`, variant: 'success' };
}

export function formatPrice(price: string | number) {
  const [whole, fraction] = Number(price).toFixed(2).split('.');
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',');

  return fraction === '00' ? `LKR ${grouped}` : `LKR ${grouped}.${fraction}`;
}
