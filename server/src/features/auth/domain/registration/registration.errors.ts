import { AppError } from '../../../../shared/errors.js';

/**
 * Thrown when attempting to register with an email that already exists
 */
export class EmailAlreadyExistsError extends AppError {
  constructor(email: string) {
    super(409, 'An account with this email already exists', 'EMAIL_ALREADY_EXISTS', { email });
    this.name = 'EmailAlreadyExistsError';
  }
}

/**
 * Thrown when unable to generate a unique organization slug
 */
export class OrganizationSlugExistsError extends AppError {
  constructor(attemptedSlug: string) {
    super(409, 'Unable to create a unique organization identifier', 'ORG_SLUG_EXISTS', {
      attemptedSlug,
    });
    this.name = 'OrganizationSlugExistsError';
  }
}

/**
 * Thrown when attempting to use a reserved slug
 */
export class ReservedSlugError extends AppError {
  constructor(slug: string) {
    super(400, 'This organization name is reserved', 'RESERVED_SLUG', { slug });
    this.name = 'ReservedSlugError';
  }
}

/**
 * Thrown when system owner role is not found in database
 */
export class SystemRoleNotFoundError extends AppError {
  constructor(roleName: string) {
    super(
      500,
      `System role "${roleName}" not found. Please run database seed.`,
      'SYSTEM_ROLE_NOT_FOUND',
      { roleName }
    );
    this.name = 'SystemRoleNotFoundError';
  }
}

/**
 * Generic registration failure
 */
export class RegistrationFailedError extends AppError {
  constructor(reason?: string) {
    super(500, reason ?? 'Registration failed. Please try again', 'REGISTRATION_FAILED');
    this.name = 'RegistrationFailedError';
  }
}

/**
 * Thrown when user not found during email verification
 */
export class UserNotFoundError extends AppError {
  constructor(email: string) {
    super(404, 'User not found', 'USER_NOT_FOUND', { email });
    this.name = 'UserNotFoundError';
  }
}

/**
 * Thrown when email is already verified
 */
export class EmailAlreadyVerifiedError extends AppError {
  constructor(email: string) {
    super(400, 'Email already verified', 'EMAIL_ALREADY_VERIFIED', { email });
    this.name = 'EmailAlreadyVerifiedError';
  }
}

/**
 * Thrown when no active verification token exists
 */
export class NoActiveTokenError extends AppError {
  constructor(userId: string) {
    super(400, 'No active verification token', 'NO_ACTIVE_TOKEN', { userId });
    this.name = 'NoActiveTokenError';
  }
}

/**
 * Thrown when OTP has expired
 */
export class ExpiredOTPError extends AppError {
  constructor() {
    super(400, 'Verification code has expired', 'EXPIRED_OTP');
    this.name = 'ExpiredOTPError';
  }
}

/**
 * Thrown when OTP is invalid
 */
export class InvalidOTPError extends AppError {
  constructor() {
    super(400, 'Invalid verification code', 'INVALID_OTP');
    this.name = 'InvalidOTPError';
  }
}

/**
 * Thrown when too many OTP attempts
 */
export class TooManyAttemptsError extends AppError {
  constructor(userId: string) {
    super(429, 'Too many failed attempts', 'TOO_MANY_ATTEMPTS', { userId });
    this.name = 'TooManyAttemptsError';
  }
}

/**
 * Generic email verification failure
 */
export class VerificationFailedError extends AppError {
  constructor(reason?: string) {
    super(500, reason ?? 'Email verification failed', 'VERIFICATION_FAILED');
    this.name = 'VerificationFailedError';
  }
}
