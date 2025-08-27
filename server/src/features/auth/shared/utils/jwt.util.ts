import { randomBytes, randomUUID, createHash } from 'node:crypto';

import jwt from 'jsonwebtoken';

import { env } from '../../../../config/env.js';
import { AUTH } from '../auth.constants.js';

import type { JwtPayload } from '../../domain/session/session.dto.js';

/**
 * Generate a JWT access token
 */
export function generateAccessToken(payload: JwtPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: AUTH.ACCESS_TOKEN.EXPIRES,
    issuer: env.JWT_ISSUER || 'cotizate',
    audience: env.JWT_AUDIENCE || 'cotizate-api',
    algorithm: 'HS256',
  });
}

/**
 * Generate a random refresh token
 */
export function generateRefreshToken(): string {
  return randomBytes(32).toString('hex');
}

/**
 * Hash a refresh token for secure storage
 */
export function hashRefreshToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

/**
 * Verify and decode an access token
 */
export function verifyAccessToken(token: string): JwtPayload {
  return jwt.verify(token, env.JWT_SECRET, {
    issuer: env.JWT_ISSUER || 'cotizate',
    audience: env.JWT_AUDIENCE || 'cotizate-api',
    algorithms: ['HS256'],
  }) as JwtPayload;
}

/**
 * Generate a unique JWT ID for potential blacklisting
 */
export function generateJti(): string {
  return randomUUID();
}

/**
 * Get expiry date for refresh token
 */
export function getRefreshTokenExpiry(): Date {
  const expiry = new Date();
  // Parse the refresh token expiry from string format (e.g., '30d')
  const match = AUTH.REFRESH_TOKEN.EXPIRES.match(/^(\d+)d$/);
  const days = match?.[1] ? Number.parseInt(match[1], 10) : 30; // Default to 30 if parsing fails
  expiry.setDate(expiry.getDate() + days);
  return expiry;
}

/**
 * Parse expiry string to seconds (e.g., '15m' -> 900, '30d' -> 2592000)
 */
export function parseExpiryToSeconds(expiry: string): number {
  const minuteMatch = expiry.match(/^(\d+)m$/);
  if (minuteMatch?.[1]) {
    return Number.parseInt(minuteMatch[1], 10) * 60;
  }

  const hourMatch = expiry.match(/^(\d+)h$/);
  if (hourMatch?.[1]) {
    return Number.parseInt(hourMatch[1], 10) * 60 * 60;
  }

  const dayMatch = expiry.match(/^(\d+)d$/);
  if (dayMatch?.[1]) {
    return Number.parseInt(dayMatch[1], 10) * 24 * 60 * 60;
  }

  // Default to 15 minutes if parsing fails
  return 15 * 60;
}
