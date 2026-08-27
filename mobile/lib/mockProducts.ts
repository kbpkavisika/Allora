import type { ProductDetailsValues } from '@/lib/sellerSchemas';

// Placeholder fixture data for the product management UI until a backend exists.
export interface SellerProduct extends ProductDetailsValues {
  id: string;
}

export const mockSellerProducts: SellerProduct[] = [
  {
    id: '1',
    name: 'Ridge Shell Jacket',
    description: 'Weatherproof shell jacket with a packable hood and taped seams.',
    price: '128.00',
    stockQuantity: '42',
    category: 'Apparel',
    photos: [],
  },
  {
    id: '2',
    name: 'Nulu Everyday Leggings',
    description: 'Buttery-soft leggings built for studio to street.',
    price: '99.00',
    stockQuantity: '8',
    category: 'Apparel',
    photos: [],
  },
  {
    id: '3',
    name: 'Trail Runner Low',
    description: 'Lightweight trail shoe with a grippy rubber outsole.',
    price: '145.00',
    stockQuantity: '0',
    category: 'Footwear',
    photos: [],
  },
];
