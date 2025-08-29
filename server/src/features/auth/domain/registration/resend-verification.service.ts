// No crypto needed; we return generic responses to prevent enumeration

import { PrismaClient } from '@prisma/client';

import { env } from '../../../../config/env.js';
import { logger } from '../../../../config/logger.js';
import { emailQueue } from '../../../../email/queue.js';
import { AuditLogRepository } from '../../repositories/audit-log.repository.js';
import { EmailVerificationTokenRepository } from '../../repositories/email-verification-token.repository.js';
import { OtpAttemptRepository } from '../../repositories/otp-attempt.repository.js';
import { UserRepository } from '../../repositories/user.repository.js';
import { AUTH } from '../../shared/auth.constants.js';
import { generateOTP, hashOTP, getOTPExpiryDate } from '../../shared/utils/otp.util.js';

import type {
  ResendVerificationRequestDto,
  ResendVerificationResponseDto,
} from './registration.dto.js';
import type { Logger } from 'pino';

export class ResendVerificationService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly userRepo: UserRepository,
    private readonly emailTokenRepo: EmailVerificationTokenRepository,
    private readonly otpAttemptRepo: OtpAttemptRepository,
    private readonly auditRepo: AuditLogRepository
  ) {}

  async resendVerification(
    dto: ResendVerificationRequestDto,
    context?: { ipAddress?: string; userAgent?: string; logger?: Logger }
  ): Promise<ResendVerificationResponseDto> {
    const log = context?.logger ?? logger;
    const { email } = dto;
    const normalizedEmail = email.toLowerCase();

    log.debug({ email: normalizedEmail }, 'Starting resend verification process');

    try {
      // Step 1: Find user by email with related profile/org
      const user = await this.userRepo.findByEmailWithProfile(normalizedEmail);

      if (!user) {
        log.info({ email: normalizedEmail }, 'Resend attempt for non-existent user');

        // Return generic success to prevent enumeration
        return {
          success: true,
          message: 'Verification code sent. Please check your email.',
          data: {
            email: normalizedEmail,
          },
        };
      }

      log.debug({ userId: user.id, email: normalizedEmail }, 'User found for resend');

      // Step 2: Check if already verified
      if (user.emailVerified) {
        log.info(
          { userId: user.id, email: normalizedEmail },
          'Resend attempt for already verified email'
        );

        // Optionally send "already verified" email
        try {
          await emailQueue.add('already-verified', {
            to: normalizedEmail,
            subject: 'Email Already Verified',
            template: 'already-verified',
            data: {
              email: normalizedEmail,
              loginUrl: `${env.FRONTEND_URL}/login`,
              ipAddress: context?.ipAddress,
              requestTime: new Date().toISOString(),
            },
          });
          log.debug({ email: normalizedEmail }, 'Already-verified email queued');
        } catch (queueError) {
          log.error(
            { error: queueError, email: normalizedEmail },
            'Failed to queue already-verified email'
          );
        }

        // Return success (email already verified, nothing to resend)
        return {
          success: true,
          message: 'Verification code sent. Please check your email.',
          data: {
            email: normalizedEmail,
          },
        };
      }

      // Step 3: Ensure OTP attempt record exists
      let otpAttempt = await this.otpAttemptRepo.findByUserId(user.id);

      if (!otpAttempt) {
        log.warn({ userId: user.id }, 'Missing OTP attempt record, creating one');
        // Handle corrupted data - create missing record
        otpAttempt = await this.otpAttemptRepo.create(user.id);
      }

      log.debug(
        { userId: user.id, currentAttempts: otpAttempt.attemptCount },
        'Current OTP attempt status'
      );

      // Step 4: Check cooldown
      const lastToken = await this.emailTokenRepo.findMostRecentByUserId(user.id);

      if (lastToken) {
        const secondsSinceLastToken = Math.floor(
          (Date.now() - lastToken.createdAt.getTime()) / 1000
        );

        if (secondsSinceLastToken < AUTH.OTP.RESEND_COOLDOWN_SECONDS) {
          const remainingCooldown = AUTH.OTP.RESEND_COOLDOWN_SECONDS - secondsSinceLastToken;

          log.info(
            {
              userId: user.id,
              email: normalizedEmail,
              secondsSinceLastToken,
              remainingCooldown,
            },
            'Resend attempted within cooldown period'
          );

          // Still return success but with cooldown info
          return {
            success: true,
            message: 'Verification code sent. Please check your email.',
            data: {
              email: normalizedEmail,
              cooldownSeconds: remainingCooldown,
            },
          };
        }
      }

      // Step 5: Generate new OTP
      const otp = generateOTP();
      const otpHash = hashOTP(otp);
      const otpExpiresAt = getOTPExpiryDate();

      log.debug({ userId: user.id }, 'Generated new OTP for resend');

      // Step 6: Database transaction
      try {
        await this.prisma.$transaction(async (tx) => {
          // Invalidate all existing tokens
          log.debug({ userId: user.id }, 'Invalidating all existing tokens');
          await this.emailTokenRepo.invalidateAllForUser(user.id, tx);

          // Reset OTP attempts to 0 (unlock user if locked)
          log.debug({ userId: user.id }, 'Resetting OTP attempts to 0');
          await this.otpAttemptRepo.reset(user.id, tx);

          // Create new verification token
          log.debug({ userId: user.id }, 'Creating new verification token');
          await this.emailTokenRepo.create(
            {
              userId: user.id,
              tokenHash: otpHash,
              expiresAt: otpExpiresAt,
            },
            tx
          );

          // Create audit log
          log.debug({ userId: user.id }, 'Creating audit log entry');
          await this.auditRepo.create(
            {
              userId: user.id,
              action: 'resend_verification',
              resourceType: 'email_verification',
              resourceId: user.id,
              afterData: {
                email: normalizedEmail,
                attemptReset: true,
              },
              ipAddress: context?.ipAddress ?? null,
              userAgent: context?.userAgent ?? null,
            },
            tx
          );
        });

        log.debug({ userId: user.id }, 'Resend transaction completed successfully');
      } catch (txError) {
        log.error(
          {
            error: txError instanceof Error ? txError.message : 'Unknown error',
            userId: user.id,
            email: normalizedEmail,
          },
          'Resend verification transaction failed'
        );

        // Even on transaction failure, return success to prevent enumeration
        return {
          success: true,
          message: 'Verification code sent. Please check your email.',
          data: {
            email: normalizedEmail,
          },
        };
      }

      // Step 7: Queue verification email (outside transaction)
      try {
        const firstName = user.profile?.firstName ?? 'User';

        await emailQueue.add('registration-verification', {
          to: normalizedEmail,
          subject: 'Verify Your Email Address',
          template: 'registration-success',
          data: {
            firstName,
            otpCode: otp, // Send unhashed OTP
            organizationName: user.organization?.name ?? '',
            email: normalizedEmail,
            companyName: 'Cotizate',
            expiryMinutes: AUTH.OTP.EXPIRY_MINUTES,
            ipAddress: context?.ipAddress,
            requestTime: new Date().toISOString(),
          },
        });

        log.debug({ userId: user.id, email: normalizedEmail }, 'Resend verification email queued');
      } catch (queueError) {
        // Log error but don't fail the resend
        log.error(
          { error: queueError, email: normalizedEmail, userId: user.id },
          'Failed to queue resend verification email'
        );
        // Continue - token was created successfully even if email failed
      }

      log.info(
        {
          userId: user.id,
          email: normalizedEmail,
          attemptsReset: true,
        },
        'Verification code resend successful'
      );

      // Step 8: Return success response
      return {
        success: true,
        message: 'Verification code sent. Please check your email.',
        data: {
          email: normalizedEmail,
        },
      };
    } catch (error) {
      // Catch any unexpected errors and still return success
      log.error(
        {
          error: error instanceof Error ? error.message : 'Unknown error',
          email: normalizedEmail,
        },
        'Unexpected error during resend verification'
      );

      // Always return success to prevent any form of enumeration
      return {
        success: true,
        message: 'Verification code sent. Please check your email.',
        data: {
          email: normalizedEmail,
        },
      };
    }
  }
}
