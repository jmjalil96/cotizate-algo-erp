import { Response, CookieOptions, Request } from 'express';

import { env } from '../../../../config/env.js';
import { AUTH } from '../auth.constants.js';

import type { TokenPair } from '../../domain/session/session.dto.js';

/**
 * Cookie configuration for authentication tokens
 */
export const COOKIE_OPTIONS = {
  ACCESS_TOKEN: {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 15 * 60 * 1000, // 15 minutes in milliseconds
    path: '/',
  } as CookieOptions,

  REFRESH_TOKEN: {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days in milliseconds
    path: `${env.API_PREFIX}/auth/refresh`, // Only sent to refresh endpoint
  } as CookieOptions,
};

/**
 * Set authentication cookies
 */
export function setAuthCookies(res: Response, tokens: TokenPair): void {
  res.cookie(AUTH.COOKIES.ACCESS_TOKEN_NAME, tokens.accessToken, COOKIE_OPTIONS.ACCESS_TOKEN);
  res.cookie(AUTH.COOKIES.REFRESH_TOKEN_NAME, tokens.refreshToken, COOKIE_OPTIONS.REFRESH_TOKEN);
}

/**
 * Clear authentication cookies (for logout)
 */
export function clearAuthCookies(res: Response): void {
  res.clearCookie(AUTH.COOKIES.ACCESS_TOKEN_NAME, { path: '/' });
  res.clearCookie(AUTH.COOKIES.REFRESH_TOKEN_NAME, { path: `${env.API_PREFIX}/auth/refresh` });
}

/**
 * Extract refresh token from request cookies
 */
export function extractRefreshToken(req: Request): string | undefined {
  return req.cookies?.[AUTH.COOKIES.REFRESH_TOKEN_NAME];
}
