import { createHash, randomUUID } from 'node:crypto';

import { Request } from 'express';
import { UAParser } from 'ua-parser-js';

/**
 * Generate a device fingerprint from request headers
 * Uses multiple headers to create a unique fingerprint
 */
export function generateDeviceFingerprint(req: Request): string {
  const ua = req.headers['user-agent'] ?? '';
  const accept = req.headers['accept'] ?? '';
  const acceptEncoding = req.headers['accept-encoding'] ?? '';
  const acceptLanguage = req.headers['accept-language'] ?? '';

  // Combine headers to create a unique fingerprint
  const fingerprint = `${ua}|${accept}|${acceptEncoding}|${acceptLanguage}`;

  return createHash('sha256').update(fingerprint).digest('hex');
}

/**
 * Parse user agent to get human-readable device name
 * Format: "Browser on OS"
 */
export function parseDeviceName(userAgent: string): string {
  if (!userAgent) {
    return 'Unknown Device';
  }

  const parser = new UAParser(userAgent);
  const browser = parser.getBrowser();
  const os = parser.getOS();

  const browserName = browser.name ?? 'Unknown Browser';
  const osName = os.name ?? 'Unknown OS';

  return `${browserName} on ${osName}`;
}

/**
 * Generate a family ID for refresh token rotation tracking
 */
export function generateFamilyId(): string {
  return randomUUID();
}

/**
 * Extract device context from request
 * Centralizes IP address, user agent, and device fingerprint extraction
 */
export function extractDeviceContext(req: Request): {
  ipAddress: string;
  userAgent: string;
  deviceFingerprint: string;
} {
  const ipAddress = req.ip ?? req.socket.remoteAddress ?? 'unknown';
  const userAgent = req.headers['user-agent'] ?? 'unknown';
  const deviceFingerprint = generateDeviceFingerprint(req);

  return { ipAddress, userAgent, deviceFingerprint };
}
