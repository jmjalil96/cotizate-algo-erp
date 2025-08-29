import { PrismaClient } from '@prisma/client';

import { logger } from '../../../../config/logger.js';
import { AuditLogRepository } from '../../repositories/audit-log.repository.js';
import { EmailVerificationTokenRepository } from '../../repositories/email-verification-token.repository.js';
import { OtpAttemptRepository } from '../../repositories/otp-attempt.repository.js';
import { UserRepository } from '../../repositories/user.repository.js';
import { hashOTP } from '../../shared/utils/otp.util.js';
import {
  UserNotFoundError,
  EmailAlreadyVerifiedError,
  NoActiveTokenError,
  ExpiredOTPError,
  InvalidOTPError,
  TooManyAttemptsError,
  VerificationFailedError,
} from '../registration/registration.errors.js';

import type {
  VerifyEmailRequestDto,
  VerifyEmailResponseDto,
} from '../registration/registration.dto.js';
import type { Logger } from 'pino';

export class EmailVerificationService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly userRepo: UserRepository,
    private readonly emailTokenRepo: EmailVerificationTokenRepository,
    private readonly otpAttemptRepo: OtpAttemptRepository,
    private readonly auditRepo: AuditLogRepository
  ) {}

  async verifyEmail(
    dto: VerifyEmailRequestDto,
    context?: { ipAddress?: string; userAgent?: string; logger?: Logger }
  ): Promise<VerifyEmailResponseDto> {
    // Use context logger if available, fallback to module logger
    const log = context?.logger ?? logger;
    const { email, otp } = dto;
    const normalizedEmail = email.toLowerCase();

    log.debug({ email: normalizedEmail }, 'Starting email verification process');

    // Step 1: Find user by email
    const user = await this.userRepo.findByEmail(normalizedEmail);

    if (!user) {
      log.error({ email: normalizedEmail }, 'Email verification attempt for non-existent user');
      throw new UserNotFoundError(normalizedEmail);
    }

    log.debug({ userId: user.id, email: normalizedEmail }, 'User found for verification');

    // Step 2: Check if already verified
    if (user.emailVerified) {
      log.info(
        { userId: user.id, email: normalizedEmail },
        'Email verification attempt for already verified email'
      );
      throw new EmailAlreadyVerifiedError(normalizedEmail);
    }

    // Step 3: Ensure OTP attempt record exists (defensive programming)
    let otpAttempt = await this.otpAttemptRepo.findByUserId(user.id);

    if (!otpAttempt) {
      log.warn({ userId: user.id }, 'Missing OTP attempt record, creating one');
      // Handle corrupted data - create missing record
      otpAttempt = await this.otpAttemptRepo.create(user.id);
    }

    // Check if locked (5+ attempts)
    if (otpAttempt.attemptCount >= 5) {
      log.error(
        { userId: user.id, email: normalizedEmail, attempts: otpAttempt.attemptCount },
        'Email verification blocked - too many attempts'
      );
      throw new TooManyAttemptsError(user.id);
    }

    // Step 4: Get most recent active verification token (regardless of expiry)
    log.debug({ userId: user.id }, 'Fetching most recent active verification token');
    const token = await this.emailTokenRepo.findMostRecentActiveByUserId(user.id);

    if (!token) {
      log.error({ userId: user.id }, 'No active verification token found');

      // Increment attempts for missing token
      const newAttemptCount = await this.otpAttemptRepo.increment(user.id);
      log.debug(
        { userId: user.id, attempts: newAttemptCount },
        'Incremented OTP attempts for missing token'
      );

      // Check if now locked
      if (newAttemptCount >= 5) {
        log.error(
          { userId: user.id, attempts: newAttemptCount },
          'User locked out after too many attempts with no token'
        );
        throw new TooManyAttemptsError(user.id);
      }

      throw new NoActiveTokenError(user.id);
    }

    // Step 5: Check token expiry
    const now = new Date();
    if (token.expiresAt < now) {
      log.error({ userId: user.id, tokenId: token.id }, 'Verification token expired');

      // Increment attempts on expired token
      const newAttemptCount = await this.otpAttemptRepo.increment(user.id);
      log.debug(
        { userId: user.id, attempts: newAttemptCount },
        'Incremented OTP attempts for expired token'
      );

      // Check if now locked
      if (newAttemptCount >= 5) {
        log.error(
          { userId: user.id, attempts: newAttemptCount },
          'User locked out after too many attempts with expired token'
        );

        // Invalidate all tokens when locked
        await this.emailTokenRepo.invalidateAllForUser(user.id);
        log.debug({ userId: user.id }, 'Invalidated all verification tokens due to lockout');

        throw new TooManyAttemptsError(user.id);
      }

      throw new ExpiredOTPError();
    }

    // Step 6: Verify OTP
    log.debug({ userId: user.id }, 'Verifying OTP');
    const otpHash = hashOTP(otp);

    if (token.tokenHash !== otpHash) {
      log.error({ userId: user.id }, 'Invalid OTP provided');

      // Increment attempts
      const newAttemptCount = await this.otpAttemptRepo.increment(user.id);
      log.debug({ userId: user.id, attempts: newAttemptCount }, 'Incremented OTP attempts');

      // Check if now locked (5 attempts)
      if (newAttemptCount >= 5) {
        log.error(
          { userId: user.id, attempts: newAttemptCount },
          'User locked out after 5 failed attempts'
        );

        // Invalidate all tokens for this user
        await this.emailTokenRepo.invalidateAllForUser(user.id);
        log.debug({ userId: user.id }, 'Invalidated all verification tokens');
      }

      throw new InvalidOTPError();
    }

    // Step 7: Success - Update in transaction
    log.debug({ userId: user.id }, 'OTP verified successfully, updating user');

    try {
      await this.prisma.$transaction(async (tx) => {
        // Mark email as verified
        log.debug({ userId: user.id }, 'Marking email as verified');
        await this.userRepo.markEmailVerified(user.id, tx);

        // Mark token as used
        log.debug({ tokenId: token.id }, 'Marking token as used');
        await this.emailTokenRepo.markAsUsed(token.id, tx);

        // Reset OTP attempts
        log.debug({ userId: user.id }, 'Resetting OTP attempts');
        await this.otpAttemptRepo.reset(user.id, tx);

        // Log verification
        log.debug({ userId: user.id }, 'Creating audit log entry');
        await this.auditRepo.logEmailVerification(
          {
            userId: user.id,
            email: normalizedEmail,
            ...(context?.ipAddress && { ipAddress: context.ipAddress }),
            ...(context?.userAgent && { userAgent: context.userAgent }),
          },
          tx
        );
      });

      log.info(
        {
          userId: user.id,
          email: normalizedEmail,
        },
        'Email verification successful'
      );

      // Return success response
      return {
        success: true,
        message: 'Email verified successfully',
      };
    } catch (error) {
      log.error(
        {
          error: error instanceof Error ? error.message : 'Unknown error',
          userId: user.id,
        },
        'Email verification transaction failed'
      );

      throw new VerificationFailedError('Unable to complete email verification');
    }
  }
}
