/**
 * Authentication Constants
 */

export const AUTH = {
  OTP: {
    LENGTH: 6,
    EXPIRY_MINUTES: 10,
    MAX_ATTEMPTS: 5,
    RESEND_COOLDOWN_SECONDS: 60,
  },
  
  PASSWORD: {
    ARGON2: {
      MEMORY_COST: 65536,     // 64 MB
      TIME_COST: 3,           // Number of iterations
      PARALLELISM: 4,         // Degree of parallelism
    },
  },
  
  DEFAULTS: {
    USER_ROLE: 'owner',     // Role for organization creator
    TIMEZONE: 'America/Quito',
  },
} as const;

export const RESERVED_ORG_SLUGS = [
  'api',
  'app', 
  'admin',
  'dashboard',
  'auth',
  'settings',
] as const;