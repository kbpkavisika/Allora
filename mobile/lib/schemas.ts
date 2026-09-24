import { z } from 'zod';

import { MESSAGE_MAX_LENGTH } from '@/lib/chat';
import { returnReasons } from '@/lib/orders';

const email = z
  .string()
  .trim()
  .min(1, { error: 'Enter your email address.' })
  .pipe(z.email({ error: 'Enter a valid email address, like hello@company.com.' }));

const newPassword = z.string().min(8, { error: 'Use at least 8 characters.' });

export const signInSchema = z.object({
  email,
  password: z.string().min(1, { error: 'Enter your password.' }),
});

export const signUpSchema = z
  .object({
    email,
    password: newPassword,
    confirmPassword: z.string().min(1, { error: 'Re-enter your password.' }),
  })
  .refine((values) => values.password === values.confirmPassword, {
    error: 'Passwords do not match.',
    path: ['confirmPassword'],
  });

export const profileSchema = z.object({
  fullName: z.string().trim().min(1, { error: 'Enter your name.' }),
  phone: z
    .string()
    .trim()
    .optional()
    .refine((value) => !value || value.length >= 7, { error: 'Enter a valid phone number.' }),
});

export const shippingAddressSchema = z.object({
  label: z
    .string()
    .trim()
    .min(2, { error: 'Name this address.' })
    .max(20, { error: 'Keep the name under 20 characters.' }),
  line1: z
    .string()
    .trim()
    .min(1, { error: 'Enter your street address.' })
    .max(120, { error: 'Keep the street address under 120 characters.' }),
  line2: z
    .string()
    .trim()
    .max(60, { error: 'Keep the apartment or unit under 60 characters.' })
    .optional(),
  city: z
    .string()
    .trim()
    .min(1, { error: 'Enter your city.' })
    .max(80, { error: 'Keep the city under 80 characters.' }),
  region: z.string().trim().min(1, { error: 'Choose a province.' }),
  postalCode: z
    .string()
    .trim()
    .min(3, { error: 'Enter a complete postal code.' })
    .max(12, { error: 'Keep the postal code under 12 characters.' }),
  country: z.string().trim().min(1, { error: 'Choose a country.' }),
  deliveryNote: z
    .string()
    .trim()
    .max(200, { error: 'Keep the delivery note under 200 characters.' })
    .optional(),
  leaveAtDoor: z.boolean(),
});

export const resetPasswordSchema = z
  .object({
    currentPassword: z.string().min(1, { error: 'Enter your current password.' }),
    newPassword,
  })
  .refine((values) => values.newPassword !== values.currentPassword, {
    error: 'Choose a password you have not used before.',
    path: ['newPassword'],
  });

export const returnRequestSchema = z.object({
  reason: z.enum(returnReasons, { error: 'Choose what went wrong.' }),
  details: z
    .string()
    .trim()
    .max(1000, { error: 'Keep the details under 1000 characters.' })
    .optional(),
});

export const reviewSchema = z.object({
  rating: z
    .number()
    .int()
    .min(1, { error: 'Choose a star rating.' })
    .max(5, { error: 'Choose a star rating.' }),
  headline: z
    .string()
    .trim()
    .min(3, { error: 'Give your review a short headline.' })
    .max(80, { error: 'Keep the headline under 80 characters.' }),
  body: z
    .string()
    .trim()
    .min(10, { error: 'Tell us a little more about the product.' })
    .max(1000, { error: 'Keep your review under 1000 characters.' }),
  photos: z.array(z.string()).max(6, { error: 'Add up to 6 photos.' }),
});

export const messageSchema = z.object({
  body: z
    .string()
    .trim()
    .min(1, { error: 'Write a message first.' })
    .max(MESSAGE_MAX_LENGTH, {
      error: `Keep your message under ${MESSAGE_MAX_LENGTH} characters.`,
    }),
});

export type SignInValues = z.infer<typeof signInSchema>;
export type SignUpValues = z.infer<typeof signUpSchema>;
export type ProfileValues = z.infer<typeof profileSchema>;
export type ShippingAddressValues = z.infer<typeof shippingAddressSchema>;
export type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;
export type ReturnRequestValues = z.infer<typeof returnRequestSchema>;
export type ReviewValues = z.infer<typeof reviewSchema>;
export type MessageValues = z.infer<typeof messageSchema>;
