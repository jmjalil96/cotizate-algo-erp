import { AppError } from '../../../../shared/errors.js';

/**
 * Generic password reset failure for unexpected errors
 * This is the only error thrown from forgot-password endpoint
 * All other conditions return success to prevent enumeration
 */
export class PasswordResetFailedError extends AppError {
  constructor(reason?: string) {
    super(
      500,
      'Unable to process password reset request',
      'PASSWORD_RESET_FAILED',
      reason ? { reason } : undefined // Only include reason in internal logs
    );
    this.name = 'PasswordResetFailedError';
  }
}

/**
 * Invalid or expired reset code error
 * Used when OTP validation fails in reset-password endpoint
 */
export class InvalidResetCodeError extends AppError {
  constructor() {
    super(400, 'Invalid or expired verification code', 'INVALID_RESET_CODE');
    this.name = 'InvalidResetCodeError';
  }
}
