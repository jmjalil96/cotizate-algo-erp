import { z } from 'zod';

/**
 * Forgot password validation schema - matches backend validator
 */
export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .email('Correo electrónico inválido')
    .max(320, 'Correo demasiado largo')
    .toLowerCase()
    .trim(),
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

/**
 * Reset password validation schema - matches backend validator
 */
export const resetPasswordSchema = z.object({
  email: z
    .string()
    .email('Correo electrónico inválido')
    .max(320, 'Correo demasiado largo')
    .toLowerCase()
    .trim(),

  otp: z
    .string()
    .length(6, 'El código debe tener 6 dígitos')
    .regex(/^\d{6}$/, 'El código debe contener solo números'),

  newPassword: z
    .string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .regex(/[A-Z]/, 'Debe contener al menos una mayúscula')
    .regex(/[a-z]/, 'Debe contener al menos una minúscula')
    .regex(/\d/, 'Debe contener al menos un número')
    .regex(/[^\dA-Za-z]/, 'Debe contener al menos un carácter especial'),
});

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
