import { z } from 'zod';

/**
 * Registration validation schema - matches backend validator
 */
export const registerSchema = z.object({
  email: z
    .string()
    .email('Correo electrónico inválido')
    .max(320, 'Correo demasiado largo')
    .toLowerCase()
    .trim(),

  password: z
    .string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .regex(/[A-Z]/, 'Debe contener al menos una mayúscula')
    .regex(/[a-z]/, 'Debe contener al menos una minúscula')
    .regex(/\d/, 'Debe contener al menos un número')
    .regex(/[^\dA-Za-z]/, 'Debe contener al menos un carácter especial'),

  firstName: z
    .string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(50, 'Nombre demasiado largo')
    .regex(/^[\s'A-Za-z-]+$/, 'El nombre contiene caracteres inválidos')
    .trim(),

  lastName: z
    .string()
    .min(2, 'El apellido debe tener al menos 2 caracteres')
    .max(50, 'Apellido demasiado largo')
    .regex(/^[\s'A-Za-z-]+$/, 'El apellido contiene caracteres inválidos')
    .trim(),

  organizationName: z
    .string()
    .min(3, 'El nombre debe tener al menos 3 caracteres')
    .max(100, 'Nombre de organización demasiado largo')
    .trim(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
