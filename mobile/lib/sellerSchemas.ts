import { z } from 'zod';

import { shopCategories } from '@/lib/shop';

export const shopRegistrationSchema = z.object({
  shopName: z
    .string()
    .trim()
    .min(2, { error: 'Enter your shop name.' })
    .max(60, { error: 'Keep the shop name under 60 characters.' }),
  description: z
    .string()
    .trim()
    .min(10, { error: 'Describe your shop in at least 10 characters.' })
    .max(500, { error: 'Keep the description under 500 characters.' }),
  contactEmail: z
    .string()
    .trim()
    .min(1, { error: 'Enter a contact email address.' })
    .pipe(z.email({ error: 'Enter a valid email address, like hello@company.com.' })),
  contactPhone: z
    .string()
    .trim()
    .min(7, { error: 'Enter a contact phone number.' })
    .regex(/^[0-9+()\-\s]+$/, { error: 'Use only numbers and phone symbols like + ( ) -.' }),
  address: z
    .string()
    .trim()
    .max(120, { error: 'Keep the address under 120 characters.' })
    .optional(),
});

export type ShopRegistrationValues = z.infer<typeof shopRegistrationSchema>;

export const productCategories = [
  'Apparel',
  'Footwear',
  'Accessories',
  'Home',
  'Beauty',
  'Other',
] as const;

const priceString = z
  .string()
  .trim()
  .min(1, { error: 'Enter a price.' })
  .regex(/^\d+(\.\d{1,2})?$/, { error: 'Enter a valid price, like 24.99.' })
  .refine((value) => Number(value) > 0, { error: 'Price must be greater than 0.' });

const stockQuantityString = z
  .string()
  .trim()
  .min(1, { error: 'Enter a stock quantity.' })
  .regex(/^\d+$/, { error: 'Enter a whole number, like 25.' })
  .refine((value) => Number(value) <= 100000, { error: 'Keep stock under 100,000 units.' });

const categoryString = z
  .string()
  .min(1, { error: 'Choose a category.' })
  .refine((value) => (productCategories as readonly string[]).includes(value), {
    error: 'Choose a valid category.',
  });

export const productDetailsSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, { error: 'Enter a product name.' })
    .max(80, { error: 'Keep the product name under 80 characters.' }),
  description: z
    .string()
    .trim()
    .min(10, { error: 'Describe the product in at least 10 characters.' })
    .max(1000, { error: 'Keep the description under 1000 characters.' }),
  price: priceString,
  stockQuantity: stockQuantityString,
  category: categoryString,
  imageUri: z.string().min(1, { error: 'Add a product photo.' }),
});

export type ProductDetailsValues = z.infer<typeof productDetailsSchema>;

const shopCategoryString = z
  .string()
  .min(1, { error: 'Choose what you sell.' })
  .refine((value) => (shopCategories as readonly string[]).includes(value), {
    error: 'Choose a valid category.',
  });

export const storeSetupSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, { error: 'Enter your shop name.' })
      .max(60, { error: 'Keep the shop name under 60 characters.' }),
    category: shopCategoryString,
    city: z
      .string()
      .trim()
      .min(2, { error: 'Enter your town or city.' })
      .max(80, { error: 'Keep the location under 80 characters.' }),
    phone: z
      .string()
      .trim()
      .min(7, { error: 'Enter a phone number.' })
      .regex(/^[0-9+()\-\s]+$/, { error: 'Use only numbers and phone symbols like + ( ) -.' }),
    pickupEnabled: z.boolean(),
    deliveryEnabled: z.boolean(),
    photoUri: z.string().optional(),
  })
  .refine((values) => values.pickupEnabled || values.deliveryEnabled, {
    error: 'Turn on pickup or delivery so buyers can receive orders.',
    path: ['pickupEnabled'],
  });

export type StoreSetupValues = z.infer<typeof storeSetupSchema>;

export const storeSetupStepFields: readonly (readonly (keyof StoreSetupValues)[])[] = [
  ['name', 'category'],
  ['city', 'phone', 'pickupEnabled', 'deliveryEnabled'],
  ['photoUri'],
];
