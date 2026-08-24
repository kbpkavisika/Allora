export const shopCategories = [
  'Home & Kitchen',
  'Crafts & Woodwork',
  'Apparel & Textiles',
  'Food & Beverage',
  'Beauty & Wellness',
  'Art & Decor',
  'Other',
] as const;

export type ShopCategory = (typeof shopCategories)[number];

export interface Shop {
  id: string;
  owner_id: string;
  name: string;
  category: string;
  city: string;
  phone: string;
  pickup_enabled: boolean;
  delivery_enabled: boolean;
  photo_url: string | null;
  created_at: string;
}
