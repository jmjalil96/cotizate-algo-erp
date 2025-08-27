import { z } from 'zod';

import { AUTH } from '../../shared/auth.constants.js';

/**
 * Login validation schema
 */
export const loginSchema = z.object({
  email: z.string().email('Invalid email address').max(320, 'Email too long').toLowerCase().trim(),

  password: z.string().min(1, 'Password is required').max(255, 'Password too long'),

  otp: z
    .string()
    .length(AUTH.OTP.LENGTH, `OTP must be exactly ${AUTH.OTP.LENGTH} digits`)
    .regex(/^\d+$/, `OTP must be exactly ${AUTH.OTP.LENGTH} digits`)
    .optional(),

  deviceName: z.string().max(100, 'Device name too long').trim().optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;

/**
 * Refresh validation schema
 * Body should be empty - refresh token comes from httpOnly cookie
 */
export const refreshSchema = z.object({}).strict();

export type RefreshInput = z.infer<typeof refreshSchema>;
