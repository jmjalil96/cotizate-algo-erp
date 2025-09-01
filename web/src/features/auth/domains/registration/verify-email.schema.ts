import { z } from 'zod';

/**
 * Email verification validation schema - matches backend validator
 */
export const verifyEmailSchema = z.object({
  email: z.string().email('Correo electrónico inválido').toLowerCase().trim(),

  otp: z
    .string()
    .length(6, 'El código debe tener 6 dígitos')
    .regex(/^\d{6}$/, 'El código debe contener solo números'),
});

export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;

/**
 * Resend verification validation schema
 */
export const resendVerificationSchema = z.object({
  email: z.string().email('Correo electrónico inválido').toLowerCase().trim(),
});

export type ResendVerificationInput = z.infer<typeof resendVerificationSchema>;
