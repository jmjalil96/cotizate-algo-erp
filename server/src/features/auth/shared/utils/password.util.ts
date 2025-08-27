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