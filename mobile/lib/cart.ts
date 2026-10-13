import i18n from '@/lib/i18n';
import { formatPrice, type Product } from '@/lib/products';

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

function cartLineSpeech(line: CartLine): string {
  const { product, quantity } = line;
  const issue = cartLineStockIssue(line);
  const summary = i18n.t('readAloud.cartLine', {
    name: product.name,
    count: quantity,
    price: formatPrice(product.price),
    total: formatPrice(product.price * quantity),
  });

  if (issue === 'soldOut') return `${summary} ${i18n.t('cart.soldOut')}`;
  if (issue === 'overStock') {
    return `${summary} ${i18n.t('cart.overStock', { count: product.stock_quantity })}`;
  }
  return summary;
}

export function formatCartSpeech(lines: CartLine[]): string {
  if (lines.length === 0) return i18n.t('cart.empty');

  const total = formatPrice(cartSubtotal(lines));

  return [
    i18n.t('cart.banner', { count: cartItemCount(lines), total }),
    ...lines.map(cartLineSpeech),
    cartHasStockIssues(lines) ? i18n.t('cart.fixStock') : null,
    i18n.t('readAloud.cartTotal', { total }),
  ]
    .filter(Boolean)
    .join(' ');
}
