import { z } from 'zod';

import { deliveryStatuses } from '@/lib/deliveries';
import { shopCategories } from '@/lib/shop';
import i18n from '@/lib/i18n';

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
  .min(1, { error: () => i18n.t('validation.priceRequired') })
  .regex(/^\d+(\.\d{1,2})?$/, { error: () => i18n.t('validation.priceInvalid') })
  .refine((value) => Number(value) > 0, { error: () => i18n.t('validation.priceNotPositive') });

const stockQuantityString = z
  .string()
  .trim()
  .min(1, { error: () => i18n.t('validation.stockRequired') })
  .regex(/^\d+$/, { error: () => i18n.t('validation.stockInvalid') })
  .refine((value) => Number(value) <= 100000, { error: () => i18n.t('validation.stockTooHigh') });

const categoryString = z
  .string()
  .min(1, { error: () => i18n.t('validation.categoryRequired') })
  .refine((value) => (productCategories as readonly string[]).includes(value), {
    error: () => i18n.t('validation.categoryInvalid'),
  });

export const productDetailsSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, { error: () => i18n.t('validation.productNameRequired') })
    .max(80, { error: () => i18n.t('validation.productNameTooLong') }),
  description: z
    .string()
    .trim()
    .min(10, { error: () => i18n.t('validation.descriptionTooShort') })
    .max(1000, { error: () => i18n.t('validation.descriptionTooLong') }),
  price: priceString,
  stockQuantity: stockQuantityString,
  category: categoryString,
  photos: z.array(z.string()).max(6, { error: () => i18n.t('validation.tooManyPhotos') }),
});

export type ProductDetailsValues = z.infer<typeof productDetailsSchema>;

export const productStepFields: readonly (readonly (keyof ProductDetailsValues)[])[] = [
  [],
  ['name', 'price', 'stockQuantity', 'description', 'category'],
  ['photos'],
];

const shopCategoryString = z
  .string()
  .min(1, { error: () => i18n.t('validation.shopCategoryRequired') })
  .refine((value) => (shopCategories as readonly string[]).includes(value), {
    error: () => i18n.t('validation.categoryInvalid'),
  });

export const storeSetupSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, { error: () => i18n.t('validation.shopNameRequired') })
      .max(60, { error: () => i18n.t('validation.shopNameTooLong') }),
    category: shopCategoryString,
    city: z
      .string()
      .trim()
      .min(2, { error: () => i18n.t('validation.shopCityRequired') })
      .max(80, { error: () => i18n.t('validation.shopCityTooLong') }),
    phone: z
      .string()
      .trim()
      .min(7, { error: () => i18n.t('validation.shopPhoneRequired') })
      .regex(/^[0-9+()\-\s]+$/, { error: () => i18n.t('validation.shopPhoneInvalid') }),
    pickupEnabled: z.boolean(),
    deliveryEnabled: z.boolean(),
    photoUri: z.string().optional(),
  })
  .refine((values) => values.pickupEnabled || values.deliveryEnabled, {
    error: () => i18n.t('validation.fulfilmentRequired'),
    path: ['pickupEnabled'],
  });

export type StoreSetupValues = z.infer<typeof storeSetupSchema>;

export const storeSetupStepFields: readonly (readonly (keyof StoreSetupValues)[])[] = [
  ['name', 'category'],
  ['city', 'phone', 'pickupEnabled', 'deliveryEnabled'],
  ['photoUri'],
];

const deliveryStatusString = z
  .string()
  .min(1, { error: () => i18n.t('validation.deliveryStatusRequired') })
  .refine((value) => (deliveryStatuses as readonly string[]).includes(value), {
    error: () => i18n.t('validation.deliveryStatusInvalid'),
  });

export const deliveryUpdateSchema = z.object({
  courierName: z
    .string()
    .trim()
    .min(2, { error: () => i18n.t('validation.courierRequired') })
    .max(60, { error: () => i18n.t('validation.courierTooLong') }),
  trackingNumber: z
    .string()
    .trim()
    .min(3, { error: () => i18n.t('validation.trackingRequired') })
    .max(40, { error: () => i18n.t('validation.trackingTooLong') })
    .regex(/^[A-Za-z0-9-]+$/, { error: () => i18n.t('validation.trackingInvalid') }),
  status: deliveryStatusString,
});

export type DeliveryUpdateValues = z.infer<typeof deliveryUpdateSchema>;
