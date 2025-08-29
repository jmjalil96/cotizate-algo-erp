import { PrismaClient } from '@prisma/client';

import { env } from '../../../../config/env.js';
import { logger } from '../../../../config/logger.js';
import { emailQueue } from '../../../../email/queue.js';
import { AuditLogRepository } from '../../repositories/audit-log.repository.js';
import { PasswordSecurityRepository } from '../../repositories/password-security.repository.js';
import { UserRepository } from '../../repositories/user.repository.js';
import { AUTH } from '../../shared/auth.constants.js';
import { generateOTP, hashOTP, getOTPExpiryDate } from '../../shared/utils/otp.util.js';

import { PasswordResetFailedError } from './password.errors.js';

import type {
  ForgotPasswordRequestDto,
  ForgotPasswordResponseDto,
  PasswordContext,
} from './password.dto.js';

export class ForgotPasswordService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly userRepo: UserRepository,
    private readonly passwordSecurityRepo: PasswordSecurityRepository,
    private readonly auditRepo: AuditLogRepository
  ) {}

  async forgotPassword(
    dto: ForgotPasswordRequestDto,
    context: PasswordContext
  ): Promise<ForgotPasswordResponseDto> {
    // Use context logger if available, fallback to module logger
    const log = context.logger ?? logger;
    const { email } = dto;
    const normalizedEmail = email.toLowerCase();

    log.debug({ email: normalizedEmail }, 'Starting password reset request');

    // Generic success response for all cases (anti-enumeration)
    const genericResponse: ForgotPasswordResponseDto = {
      success: true,
      message: 'If an account exists, a password reset code has been sent',
    };

    try {
      // Step 1: Find user by email with details
      const user = await this.userRepo.findWithDetails(normalizedEmail);

      if (!user) {
        log.info({ email: normalizedEmail }, 'Password reset attempt for non-existent user');

        // Audit log even for non-existent users
        await this.auditRepo.logPasswordResetRequest({
          userId: null,
          email: normalizedEmail,
          ipAddress: context.ipAddress,
          userAgent: context.userAgent,
        });

        return genericResponse;
      }

      log.debug({ userId: user.id, email: normalizedEmail }, 'User found for password reset');

      // Step 2: Check user and organization status
      if (!user.isActive) {
        log.info({ userId: user.id, email: normalizedEmail }, 'Password reset for inactive user');
        return genericResponse;
      }

      if (!user.organization?.isActive) {
        log.info(
          { userId: user.id, organizationId: user.organizationId },
          'Password reset for user in inactive organization'
        );
        return genericResponse;
      }

      // Step 3: Get or create PasswordSecurity record (self-healing)
      let passwordSecurity = await this.passwordSecurityRepo.findByUserId(user.id);

      if (!passwordSecurity) {
        log.warn({ userId: user.id }, 'Missing PasswordSecurity record, creating one');
        passwordSecurity = await this.passwordSecurityRepo.create({ userId: user.id });
      }

      // Step 4: Check if locked (5+ attempts)
      if (passwordSecurity.resetAttemptCount >= AUTH.PASSWORD_RESET.MAX_ATTEMPTS) {
        log.info(
          {
            userId: user.id,
            email: normalizedEmail,
            attempts: passwordSecurity.resetAttemptCount,
          },
          'Password reset locked - clearing tokens'
        );

        // Clear OTP fields when locked
        await this.prisma.passwordSecurity.update({
          where: { userId: user.id },
          data: {
            resetOtpHash: null,
            resetOtpExpiresAt: null,
            resetOtpSentAt: null,
          },
        });

        // Audit log the locked attempt
        await this.auditRepo.logPasswordResetRequest({
          userId: user.id,
          email: normalizedEmail,
          wasLocked: true,
          ipAddress: context.ipAddress,
          userAgent: context.userAgent,
        });

        return genericResponse;
      }

      // Step 5: Check cooldown
      if (passwordSecurity.resetOtpSentAt) {
        const secondsSinceLastOtp = Math.floor(
          (Date.now() - passwordSecurity.resetOtpSentAt.getTime()) / 1000
        );

        if (secondsSinceLastOtp < AUTH.PASSWORD_RESET.COOLDOWN_SECONDS) {
          const remainingCooldown = AUTH.PASSWORD_RESET.COOLDOWN_SECONDS - secondsSinceLastOtp;

          log.info(
            {
              userId: user.id,
              email: normalizedEmail,
              secondsSinceLastOtp,
              remainingCooldown,
            },
            'Password reset attempted within cooldown period'
          );

          return genericResponse;
        }
      }

      // Step 6: Generate new OTP
      const otp = generateOTP();
      const otpHash = hashOTP(otp);
      const otpExpiresAt = getOTPExpiryDate(AUTH.PASSWORD_RESET.OTP_EXPIRY_MINUTES);

      log.debug({ userId: user.id }, 'Generated new OTP for password reset');

      // Step 7: Update PasswordSecurity (resets attempts to 0)
      await this.passwordSecurityRepo.setResetOtp(user.id, otpHash, otpExpiresAt);

      log.debug({ userId: user.id }, 'Password reset OTP stored successfully');

      // Step 8: Queue email (outside transaction)
      try {
        const firstName = user.profile?.firstName ?? 'User';
        const template = user.emailVerified ? 'password-reset' : 'password-reset-with-verification';

        await emailQueue.add('password-reset', {
          to: normalizedEmail,
          subject: 'Password Reset Request',
          template,
          data: {
            firstName,
            otpCode: otp, // Send unhashed OTP
            email: normalizedEmail,
            expiryMinutes: AUTH.PASSWORD_RESET.OTP_EXPIRY_MINUTES,
            ipAddress: context.ipAddress,
            requestTime: new Date().toISOString(),
            companyName: 'Cotizate',
            resetUrl: `${env.FRONTEND_URL}/reset-password`,
          },
        });

        log.debug({ userId: user.id, email: normalizedEmail }, 'Password reset email queued');
      } catch (queueError) {
        // Log error but don't fail the request
        log.error(
          { error: queueError, email: normalizedEmail, userId: user.id },
          'Failed to queue password reset email'
        );
        // Continue - OTP was created successfully even if email failed
      }

      // Step 9: Audit log
      await this.auditRepo.logPasswordResetRequest({
        userId: user.id,
        email: normalizedEmail,
        wasLocked: false,
        attemptCountReset: true,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
      });

      log.info(
        {
          userId: user.id,
          email: normalizedEmail,
          emailVerified: user.emailVerified,
        },
        'Password reset request processed successfully'
      );

      return genericResponse;
    } catch (error) {
      log.error(
        {
          error: error instanceof Error ? error.message : 'Unknown error',
          email: normalizedEmail,
        },
        'Unexpected error during password reset request'
      );

      // For genuine system errors, throw the error
      if (error instanceof Error && error.message.includes('database')) {
        throw new PasswordResetFailedError('Database error during password reset');
      }

      // For all other cases, return success to prevent enumeration
      return genericResponse;
    }
  }
}
