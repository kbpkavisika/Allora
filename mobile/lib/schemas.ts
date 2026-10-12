import { z } from 'zod';

import { MESSAGE_MAX_LENGTH } from '@/lib/chat';
import { returnReasons } from '@/lib/orders';
import i18n from '@/lib/i18n';

const email = z
  .string()
  .trim()
  .min(1, { error: () => i18n.t('validation.emailRequired') })
  .pipe(z.email({ error: () => i18n.t('validation.emailInvalid') }));

const newPassword = z.string().min(8, { error: () => i18n.t('validation.passwordTooShort') });

export const signInSchema = z.object({
  email,
  password: z.string().min(1, { error: () => i18n.t('validation.passwordRequired') }),
});

export const signUpSchema = z
  .object({
    email,
    password: newPassword,
    confirmPassword: z.string().min(1, { error: () => i18n.t('validation.confirmPasswordRequired') }),
  })
  .refine((values) => values.password === values.confirmPassword, {
    error: () => i18n.t('validation.passwordsMismatch'),
    path: ['confirmPassword'],
  });

export const profileSchema = z.object({
  fullName: z.string().trim().min(1, { error: () => i18n.t('validation.nameRequired') }),
  phone: z
    .string()
    .trim()
    .optional()
    .refine((value) => !value || value.length >= 7, { error: () => i18n.t('validation.phoneInvalid') }),
});

export const shippingAddressSchema = z.object({
  label: z
    .string()
    .trim()
    .min(2, { error: () => i18n.t('validation.addressLabelRequired') })
    .max(20, { error: () => i18n.t('validation.addressLabelTooLong') }),
  line1: z
    .string()
    .trim()
    .min(1, { error: () => i18n.t('validation.line1Required') })
    .max(120, { error: () => i18n.t('validation.line1TooLong') }),
  line2: z
    .string()
    .trim()
    .max(60, { error: () => i18n.t('validation.line2TooLong') })
    .optional(),
  city: z
    .string()
    .trim()
    .min(1, { error: () => i18n.t('validation.cityRequired') })
    .max(80, { error: () => i18n.t('validation.cityTooLong') }),
  region: z.string().trim().min(1, { error: () => i18n.t('validation.regionRequired') }),
  postalCode: z
    .string()
    .trim()
    .min(3, { error: () => i18n.t('validation.postalCodeTooShort') })
    .max(12, { error: () => i18n.t('validation.postalCodeTooLong') }),
  country: z.string().trim().min(1, { error: () => i18n.t('validation.countryRequired') }),
  deliveryNote: z
    .string()
    .trim()
    .max(200, { error: () => i18n.t('validation.deliveryNoteTooLong') })
    .optional(),
  leaveAtDoor: z.boolean(),
});

export const resetPasswordSchema = z
  .object({
    currentPassword: z.string().min(1, { error: () => i18n.t('validation.currentPasswordRequired') }),
    newPassword,
  })
  .refine((values) => values.newPassword !== values.currentPassword, {
    error: () => i18n.t('validation.passwordReused'),
    path: ['newPassword'],
  });

export const returnRequestSchema = z.object({
  reason: z.enum(returnReasons, { error: () => i18n.t('validation.returnReasonRequired') }),
  details: z
    .string()
    .trim()
    .max(1000, { error: () => i18n.t('validation.returnDetailsTooLong') })
    .optional(),
});

export const reviewSchema = z.object({
  rating: z
    .number()
    .int()
    .min(1, { error: () => i18n.t('validation.ratingRequired') })
    .max(5, { error: () => i18n.t('validation.ratingRequired') }),
  headline: z
    .string()
    .trim()
    .min(3, { error: () => i18n.t('validation.headlineTooShort') })
    .max(80, { error: () => i18n.t('validation.headlineTooLong') }),
  body: z
    .string()
    .trim()
    .min(10, { error: () => i18n.t('validation.reviewBodyTooShort') })
    .max(1000, { error: () => i18n.t('validation.reviewBodyTooLong') }),
  photos: z.array(z.string()).max(6, { error: () => i18n.t('validation.tooManyPhotos') }),
});

export const messageSchema = z.object({
  body: z
    .string()
    .trim()
    .min(1, { error: () => i18n.t('validation.messageRequired') })
    .max(MESSAGE_MAX_LENGTH, {
      error: () => i18n.t('validation.messageTooLong', { max: MESSAGE_MAX_LENGTH }),
    }),
});

export const accessibilityPreferencesSchema = z.object({
  large_text: z.boolean(),
  high_contrast: z.boolean(),
  dictation_enabled: z.boolean(),
  screen_reader_support: z.boolean(),
  reduce_motion: z.boolean(),
});

export const notificationPreferencesSchema = z.object({
  message_notifications: z.boolean(),
});

export type SignInValues = z.infer<typeof signInSchema>;
export type SignUpValues = z.infer<typeof signUpSchema>;
export type ProfileValues = z.infer<typeof profileSchema>;
export type ShippingAddressValues = z.infer<typeof shippingAddressSchema>;
export type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;
export type ReturnRequestValues = z.infer<typeof returnRequestSchema>;
export type ReviewValues = z.infer<typeof reviewSchema>;
export type MessageValues = z.infer<typeof messageSchema>;
export type AccessibilityPreferencesValues = z.infer<typeof accessibilityPreferencesSchema>;
export type NotificationPreferencesValues = z.infer<typeof notificationPreferencesSchema>;
