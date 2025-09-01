import { z } from 'zod';

/**
 * Login validation schema - matches backend session validator
 */
export const loginSchema = z.object({
  email: z
    .string()
    .email('Correo electrónico inválido')
    .max(320, 'Correo demasiado largo')
    .toLowerCase()
    .trim(),

  password: z.string().min(1, 'La contraseña es requerida').max(255, 'Contraseña demasiado larga'),

  otp: z
    .string()
    .length(6, 'El código debe tener 6 dígitos')
    .regex(/^\d{6}$/, 'El código debe contener solo números')
    .optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
