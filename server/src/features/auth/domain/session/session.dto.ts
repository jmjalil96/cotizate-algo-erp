/**
 * Session/Login DTOs
 */

import type { Logger } from 'pino';

/**
 * Login Request DTOs
 */
export interface LoginRequestDto {
  email: string;
  password: string;
  otp?: string; // Required if too many failed attempts
  deviceName?: string; // Auto-detected if not provided
}

/**
 * Login Response DTOs
 */
export interface LoginResponseDto {
  success: boolean;
  message: string;
  data?: {
    userId: string;
    email: string;
    organizationId: string;
    firstName: string;
    lastName: string;
    role: {
      id: string;
      name: string;
      description: string;
    };
    permissions: {
      resource: string;
      action: string;
      scope: string;
    }[];
  };
  requiresOtp?: boolean; // True when OTP is needed but not provided
}

/**
 * Session Context (Internal)
 */
export interface SessionContext {
  ipAddress: string;
  userAgent: string;
  deviceName: string;
  deviceFingerprint: string;
  logger?: Logger;
}

/**
 * Token Pair (Internal)
 */
export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  accessExpiresIn: number; // seconds
  refreshExpiresIn: number; // seconds
}

/**
 * JWT Access Token Payload
 */
export interface JwtPayload {
  sub: string; // userId
  email: string;
  org: string; // organizationId
  role: string; // roleId
  permissions: string[]; // Array of "resource:action:scope" strings
  iat?: number; // Issued at (added by JWT library)
  exp?: number; // Expiration (added by JWT library)
  jti: string; // JWT ID for potential blacklisting
}

/**
 * User with full details for login (Internal)
 */
export interface UserWithDetails {
  id: string;
  email: string;
  passwordHash: string;
  emailVerified: boolean;
  isActive: boolean;
  organizationId: string;
  organization: {
    id: string;
    name: string;
    isActive: boolean;
  };
  profile: {
    firstName: string;
    lastName: string;
  };
  userRole: {
    role: {
      id: string;
      name: string;
      description: string;
      rolePermissions: {
        permission: {
          resource: string;
          action: string;
          scope: string;
        };
      }[];
    };
  };
}

/**
 * Login Attempt Data (Internal)
 */
export interface LoginAttemptData {
  userId?: string;
  email: string;
  ipAddress: string;
  userAgent: string;
  deviceFingerprint: string;
  attemptType: 'password_fail' | 'otp_fail' | 'success';
  failureReason?: string;
  requiresOtp?: boolean;
  otpSentAt?: Date;
  successAt?: Date;
}

/**
 * Device Information
 */
export interface DeviceInfo {
  name: string; // "Chrome on MacOS"
  fingerprint: string;
  ipAddress: string;
  userAgent: string;
}

/**
 * Refresh Request DTOs
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface RefreshRequestDto {
  // Empty - refresh token comes from httpOnly cookie
  // Body is not used for security
}

/**
 * Refresh Response DTOs
 */
export interface RefreshResponseDto {
  success: boolean;
  message: string;
  data?: {
    userId: string;
    email: string;
    organizationId: string;
    firstName: string;
    lastName: string;
    role: {
      id: string;
      name: string;
      description: string;
    };
    permissions: {
      resource: string;
      action: string;
      scope: string;
    }[];
  };
}

/**
 * Refresh Context (Internal)
 */
export interface RefreshContext {
  ipAddress: string;
  userAgent: string;
  deviceFingerprint: string;
  logger?: Logger;
}

/**
 * Refresh Token with Details (Internal)
 */
export interface RefreshTokenDetails {
  id: string;
  userId: string;
  tokenHash: string;
  familyId: string;
  generation: number;
  parentTokenId: string | null;
  deviceName: string;
  deviceFingerprint: string;
  ipAddress: string;
  userAgent: string;
  expiresAt: Date;
  revokedAt: Date | null;
  usedAt: Date | null;
  revokedReason: string | null;
  createdAt: Date;
  user: UserWithDetails;
}

/**
 * Token Family Info for Security Tracking (Internal)
 */
export interface TokenFamilyInfo {
  familyId: string;
  tokens: {
    id: string;
    generation: number;
    usedAt: Date | null;
    revokedAt: Date | null;
    createdAt: Date;
  }[];
  suspiciousActivity: boolean;
}

/**
 * Logout Request DTO
 */
export interface LogoutRequestDto {
  everywhere?: boolean; // Optional: logout all devices (default: false)
}

/**
 * Logout Response DTO
 */
export interface LogoutResponseDto {
  success: boolean;
  message: string;
  data?: {
    sessionsRevoked: number; // How many sessions/tokens were revoked
  };
}

/**
 * Logout Context (Internal)
 */
export interface LogoutContext {
  ipAddress: string;
  userAgent: string;
  deviceFingerprint: string;
  everywhere: boolean;
  logger?: Logger;
}

/**
 * Me Request DTOs
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface MeRequestDto {
  // Empty - user identification comes from JWT in httpOnly cookie
  // Body is not used for security
}

/**
 * Me Response DTOs
 */
export interface MeResponseDto {
  success: boolean;
  message: string;
  data?: {
    userId: string;
    email: string;
    organizationId: string;
    firstName: string;
    lastName: string;
    role: {
      id: string;
      name: string;
      description: string;
    };
    permissions: {
      resource: string;
      action: string;
      scope: string;
    }[];
  };
}

/**
 * Me Context (Internal)
 */
export interface MeContext {
  userId: string; // Extracted from JWT sub claim by middleware
  jwtPayload: JwtPayload; // Full decoded JWT from middleware (for jti, permissions, etc.)
  ipAddress: string;
  userAgent: string;
  deviceFingerprint: string;
  logger?: Logger;
}
