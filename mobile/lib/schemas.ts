import { z } from 'zod';

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
  line1: z.string().trim().min(1, { error: 'Enter your street address.' }),
  line2: z.string().trim().optional(),
  city: z.string().trim().min(1, { error: 'Enter your city.' }),
  region: z.string().trim().min(1, { error: 'Choose a province.' }),
  postalCode: z.string().trim().min(3, { error: 'Enter a complete postal code.' }),
  country: z.string().trim().min(1, { error: 'Choose a country.' }),
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

export type SignInValues = z.infer<typeof signInSchema>;
export type SignUpValues = z.infer<typeof signUpSchema>;
export type ProfileValues = z.infer<typeof profileSchema>;
export type ShippingAddressValues = z.infer<typeof shippingAddressSchema>;
export type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;
