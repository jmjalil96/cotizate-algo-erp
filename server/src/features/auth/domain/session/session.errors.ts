import { AppError } from '../../../../shared/errors.js';

/**
 * Thrown for invalid credentials (email or password)
 * Used for all authentication failures to prevent enumeration
 */
export class InvalidCredentialsError extends AppError {
  constructor() {
    super(401, 'Invalid email or password', 'INVALID_CREDENTIALS');
    this.name = 'InvalidCredentialsError';
  }
}

/**
 * Thrown when email is not verified
 * Only thrown AFTER successful password validation
 */
export class EmailNotVerifiedError extends AppError {
  constructor() {
    super(403, 'Please verify your email to continue', 'EMAIL_NOT_VERIFIED');
    this.name = 'EmailNotVerifiedError';
  }
}

/**
 * Thrown when account is inactive (generic message to prevent enumeration)
 * Used for both user and organization inactive states
 */
export class AccountInactiveError extends AppError {
  constructor() {
    super(403, 'Account access restricted', 'ACCOUNT_INACTIVE');
    this.name = 'AccountInactiveError';
  }
}

/**
 * Internal error for organization inactive (maps to AccountInactiveError in response)
 * Used for internal logging only
 */
export class OrganizationInactiveError extends AppError {
  constructor(organizationId: string) {
    super(
      403,
      'Account access restricted', // Same message as AccountInactiveError
      'ORGANIZATION_INACTIVE',
      { organizationId } // Internal context for logging
    );
    this.name = 'OrganizationInactiveError';
  }
}

/**
 * Thrown when OTP is invalid, expired, or already used
 * Generic message to prevent enumeration of OTP states
 */
export class InvalidOtpError extends AppError {
  constructor() {
    super(401, 'Invalid or expired verification code', 'INVALID_OTP');
    this.name = 'InvalidOtpError';
  }
}

/**
 * Not really an error - signals that OTP is required
 * Controller should return 200 with requiresOtp: true
 */
export class OtpRequiredError extends AppError {
  constructor() {
    super(
      200, // Not an error status
      'Additional verification required',
      'OTP_REQUIRED'
    );
    this.name = 'OtpRequiredError';
  }
}

/**
 * Generic login failure for unexpected errors
 */
export class LoginFailedError extends AppError {
  constructor(reason?: string) {
    super(
      500,
      'Unable to process login request',
      'LOGIN_FAILED',
      reason ? { reason } : undefined // Only include reason in internal logs
    );
    this.name = 'LoginFailedError';
  }
}

/**
 * Thrown for all refresh token failures to prevent enumeration
 * Used for: missing, expired, revoked, not found, already used tokens
 */
export class InvalidRefreshTokenError extends AppError {
  constructor() {
    super(401, 'Invalid or expired refresh token', 'INVALID_REFRESH_TOKEN');
    this.name = 'InvalidRefreshTokenError';
  }
}

/**
 * Internal error for token reuse detection (security breach)
 * Maps to InvalidRefreshTokenError in response to prevent enumeration
 * Used for internal security logging only
 */
export class TokenReuseDetectedError extends AppError {
  constructor(context: {
    tokenId: string;
    familyId: string;
    generation: number;
    attackerIP: string;
    originalIP: string;
    userId: string;
  }) {
    super(
      401,
      'Invalid or expired refresh token', // Same message as InvalidRefreshTokenError
      'TOKEN_REUSE_DETECTED',
      context // Internal context for security audit
    );
    this.name = 'TokenReuseDetectedError';
  }
}

/**
 * Thrown when refresh token generation limit is exceeded
 * Forces user to re-authenticate instead of infinite rotation
 */
export class RefreshTokenExpiredError extends AppError {
  constructor() {
    super(401, 'Session requires re-authentication', 'REFRESH_TOKEN_EXPIRED');
    this.name = 'RefreshTokenExpiredError';
  }
}

/**
 * Generic refresh failure for unexpected errors
 */
export class RefreshFailedError extends AppError {
  constructor(reason?: string) {
    super(
      500,
      'Unable to refresh session',
      'REFRESH_FAILED',
      reason ? { reason } : undefined // Only include reason in internal logs
    );
    this.name = 'RefreshFailedError';
  }
}

/**
 * Thrown for invalid or expired access tokens
 * Used by /me endpoint and any authenticated routes
 */
export class InvalidAccessTokenError extends AppError {
  constructor() {
    super(401, 'Invalid or expired access token', 'INVALID_ACCESS_TOKEN');
    this.name = 'InvalidAccessTokenError';
  }
}

/**
 * Thrown when JWT is valid but user no longer exists
 * Indicates deleted user with valid token (rare edge case)
 */
export class UserNotFoundError extends AppError {
  constructor(userId: string) {
    super(
      401,
      'Authentication required', // Generic message to prevent enumeration
      'USER_NOT_FOUND',
      { userId } // Internal logging only
    );
    this.name = 'UserNotFoundError';
  }
}

/**
 * Generic /me endpoint failure for unexpected errors
 */
export class MeFailedError extends AppError {
  constructor(reason?: string) {
    super(500, 'Unable to retrieve user details', 'ME_FAILED', reason ? { reason } : undefined);
    this.name = 'MeFailedError';
  }
}
