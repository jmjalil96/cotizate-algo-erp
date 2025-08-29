import type { Logger } from 'pino';

/**
 * Forgot Password DTOs
 */

// Request DTO - what the client sends
export interface ForgotPasswordRequestDto {
  email: string;
}

// Response DTO - what we send back
export interface ForgotPasswordResponseDto {
  success: boolean;
  message: string;
}

/**
 * Reset Password DTOs
 */

// Request DTO - what the client sends
export interface ResetPasswordRequestDto {
  email: string;
  otp: string;
  newPassword: string;
}

// Response DTO - what we send back
export interface ResetPasswordResponseDto {
  success: boolean;
  message: string;
  data?: {
    emailVerified?: boolean;
  };
}

/**
 * Password Context (Internal)
 */
export interface PasswordContext {
  ipAddress: string;
  userAgent: string;
  logger?: Logger;
}
