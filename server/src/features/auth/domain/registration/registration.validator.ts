import { z } from 'zod';

/**
 * Registration validation schema
 */
export const registerSchema = z.object({
  email: z
    .string()
    .email('Invalid email address')
    .max(320, 'Email too long')
    .toLowerCase()
    .trim(),
  
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/\d/, 'Password must contain at least one number')
    .regex(/[^\dA-Za-z]/, 'Password must contain at least one special character'),
  
  firstName: z
    .string()
    .min(2, 'First name must be at least 2 characters')
    .max(50, 'First name too long')
    .regex(/^[\s'A-Za-z-]+$/, 'First name contains invalid characters')
    .trim(),
  
  lastName: z
    .string()
    .min(2, 'Last name must be at least 2 characters')
    .max(50, 'Last name too long')
    .regex(/^[\s'A-Za-z-]+$/, 'Last name contains invalid characters')
    .trim(),
  
  organizationName: z
    .string()
    .min(3, 'Organization name must be at least 3 characters')
    .max(100, 'Organization name too long')
    .trim(),
});

export type RegisterInput = z.infer<typeof registerSchema>;

/**
 * Email verification validation schema
 */
export const verifyEmailSchema = z.object({
  email: z
    .string()
    .email('Invalid email address')
    .toLowerCase()
    .trim(),
  
  otp: z
    .string()
    .length(6, 'OTP must be exactly 6 digits')
    .regex(/^\d{6}$/, 'OTP must be exactly 6 digits'),
});

export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;
