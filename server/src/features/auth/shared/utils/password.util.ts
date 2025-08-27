import * as argon2 from 'argon2';

import { AUTH } from '../auth.constants.js';

/**
 * Hash a password using Argon2id
 */
export async function hashPassword(password: string): Promise<string> {
  return argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: AUTH.PASSWORD.ARGON2.MEMORY_COST,
    timeCost: AUTH.PASSWORD.ARGON2.TIME_COST,
    parallelism: AUTH.PASSWORD.ARGON2.PARALLELISM,
  });
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return argon2.verify(hash, password);
}

/**
 * Get a dummy password hash for timing-safe checks
 * Used when user doesn't exist to prevent timing attacks
 */
export function getDummyPasswordHash(): string {
  // Pre-computed hash of "DummyPassword123!" to avoid timing differences
  // This ensures consistent timing whether user exists or not
  return '$argon2id$v=19$m=65536,t=3,p=4$YTBhMTFiNGNkZTk3OGY0Ng$RZLbNfTuQxLWdKBrxAQLKzLYWqIUQxWKqzqcVPd7mLs';
}
