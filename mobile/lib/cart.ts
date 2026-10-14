import { type Product } from '@/lib/products';

export interface CartLine {
  product: Product;
  quantity: number;
}

export type CartStockIssue = 'soldOut' | 'overStock';

export class CartStockLimitError extends Error {
  readonly available: number;

  constructor(available: number) {
    super('Not enough stock.');
    this.available = available;
  }
}

export function cartSubtotal(lines: CartLine[]): number {
  return lines.reduce((sum, line) => sum + line.product.price * line.quantity, 0);
}

export function cartItemCount(lines: CartLine[]): number {
  return lines.reduce((sum, line) => sum + line.quantity, 0);
}

export function cartLineStockIssue({ product, quantity }: CartLine): CartStockIssue | null {
  if (product.stock_quantity <= 0) return 'soldOut';
  if (quantity > product.stock_quantity) return 'overStock';
  return null;
}

export function cartHasStockIssues(lines: CartLine[]): boolean {
  return lines.some((line) => cartLineStockIssue(line) !== null);
}

