import type { BadgeVariant } from '@/components/ui/Badge';
import type { ProductDetailsValues } from '@/lib/sellerSchemas';

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
  badgeLabel: string;
  detailLabel: string;
  variant: BadgeVariant;
}

export const LOW_STOCK_THRESHOLD = 10;

export function getStockStatus(stockQuantity: string | number): StockStatus {
  const quantity = Number(stockQuantity);

  if (quantity <= 0) {
    return { badgeLabel: 'Sold out', detailLabel: 'None left', variant: 'neutral' };
  }

  if (quantity <= LOW_STOCK_THRESHOLD) {
    return { badgeLabel: 'Low stock', detailLabel: `${quantity} left`, variant: 'warning' };
  }

  return { badgeLabel: 'In stock', detailLabel: `${quantity} in stock`, variant: 'success' };
}

// Form fields are strings; the numeric and integer columns come back as numbers.
export function toProductFormValues(product: Product): ProductDetailsValues {
  return {
    name: product.name,
    description: product.description,
    price: String(product.price),
    stockQuantity: String(product.stock_quantity),
    category: product.category,
    photos: product.photos,
  };
}

export function toProductInput(values: ProductDetailsValues) {
  return {
    name: values.name,
    description: values.description,
    price: Number(values.price),
    stock_quantity: Number(values.stockQuantity),
    category: values.category,
    photos: values.photos,
  };
}

export function formatPrice(price: string | number) {
  const [whole, fraction] = Number(price).toFixed(2).split('.');
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',');

  return fraction === '00' ? `LKR ${grouped}` : `LKR ${grouped}.${fraction}`;
}
