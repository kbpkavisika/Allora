import { z } from 'zod';

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
