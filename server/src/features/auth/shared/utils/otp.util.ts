import { createHash, randomInt } from 'node:crypto';

import { AUTH } from '../auth.constants.js';

/**
 * Generate a cryptographically secure numeric OTP
 */
export function generateOTP(length: number = AUTH.OTP.LENGTH): string {
  let otp = '';

  for (let i = 0; i < length; i++) {
    otp += randomInt(0, 10).toString();
  }

  return otp;
}

/**
 * Hash an OTP for storage (using SHA-256 for speed since OTPs are short-lived)
 */
export function hashOTP(otp: string): string {
  return createHash('sha256').update(otp).digest('hex');
}

/**
 * Calculate OTP expiry date
 */
export function getOTPExpiryDate(expiryMinutes: number = AUTH.OTP.EXPIRY_MINUTES): Date {
  const now = new Date();
  now.setMinutes(now.getMinutes() + expiryMinutes);
  return now;
}
