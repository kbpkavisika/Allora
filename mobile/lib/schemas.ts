import { z } from 'zod';

const email = z
  .string()
  .trim()
  .min(1, { error: 'Enter your email address.' })
  .pipe(z.email({ error: 'Enter a valid email address, like hello@company.com.' }));

const newPassword = z.string().min(6, { error: 'Use at least 6 characters.' });

export const signInSchema = z.object({
  email,
  password: z.string().min(1, { error: 'Enter your password.' }),
});

export const signUpSchema = z.object({ email });

export const createPasswordSchema = z.object({ password: newPassword });

export type SignInValues = z.infer<typeof signInSchema>;
export type SignUpValues = z.infer<typeof signUpSchema>;
export type CreatePasswordValues = z.infer<typeof createPasswordSchema>;
