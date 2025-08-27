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
      MEMORY_COST: 65536, // 64 MB
      TIME_COST: 3, // Number of iterations
      PARALLELISM: 4, // Degree of parallelism
    },
  },

  LOGIN: {
    MAX_ATTEMPTS: 5, // Failed attempts before requiring OTP (permanent until successful login)
  },

  COOKIES: {
    ACCESS_TOKEN_NAME: 'access_token',
    REFRESH_TOKEN_NAME: 'refresh_token',
  },

  ACCESS_TOKEN: {
    EXPIRES: '15m', // 15 minutes
  },

  REFRESH_TOKEN: {
    EXPIRES: '30d', // 30 days
    ROTATION_REUSE_WINDOW: 5000, // 5 seconds grace period for race conditions
    MAX_FAMILY_SIZE: 10, // Maximum tokens in a family chain
  },

  JWT: {
    // Algorithm and issuer/audience are set in env
    // Token expiries moved to ACCESS_TOKEN and REFRESH_TOKEN sections
  },

  DEFAULTS: {
    USER_ROLE: 'owner', // Role for organization creator
    TIMEZONE: 'America/Quito',
  },
} as const;

export const RESERVED_ORG_SLUGS = ['api', 'app', 'admin', 'dashboard', 'auth', 'settings'] as const;
