import { PrismaClient } from '@prisma/client';

import { logger } from '../../../../config/logger.js';
import { emailQueue } from '../../../../email/queue.js';
import { AuditLogRepository } from '../../repositories/audit-log.repository.js';
import { PasswordSecurityRepository } from '../../repositories/password-security.repository.js';
import { RefreshTokenRepository } from '../../repositories/refresh-token.repository.js';
import { UserRepository } from '../../repositories/user.repository.js';
import { AUTH } from '../../shared/auth.constants.js';
import { hashOTP } from '../../shared/utils/otp.util.js';
import { hashPassword } from '../../shared/utils/password.util.js';

import { InvalidResetCodeError, PasswordResetFailedError } from './password.errors.js';

import type {
  ResetPasswordRequestDto,
  ResetPasswordResponseDto,
  PasswordContext,
} from './password.dto.js';

export class ResetPasswordService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly userRepo: UserRepository,
    private readonly passwordSecurityRepo: PasswordSecurityRepository,
    private readonly refreshTokenRepo: RefreshTokenRepository,
    private readonly auditRepo: AuditLogRepository
  ) {}

  async resetPassword(
    dto: ResetPasswordRequestDto,
    context: PasswordContext
  ): Promise<ResetPasswordResponseDto> {
    // Use context logger if available, fallback to module logger
    const log = context.logger ?? logger;
    const { email, otp, newPassword } = dto;
    const normalizedEmail = email.toLowerCase();

    log.debug({ email: normalizedEmail }, 'Starting password reset process');

    // Generic success response for anti-enumeration
    const genericResponse: ResetPasswordResponseDto = {
      success: true,
      message: 'Password reset successfully',
    };

    try {
      // Step 1: Find user by email with details
      const user = await this.userRepo.findWithDetails(normalizedEmail);

      if (!user) {
        log.info({ email: normalizedEmail }, 'Password reset attempt for non-existent user');
        // Return success to prevent enumeration
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

      // Step 4: Validate reset state
      if (!passwordSecurity.resetOtpHash) {
        log.info(
          { userId: user.id, email: normalizedEmail },
          'Password reset attempted without requesting code first'
        );

        await this.auditRepo.logPasswordResetFailed({
          userId: user.id,
          email: normalizedEmail,
          reason: 'invalid_code',
          attemptCount: 0,
          locked: false,
          ipAddress: context.ipAddress,
          userAgent: context.userAgent,
        });

        throw new InvalidResetCodeError();
      }

      // Step 5: Check if locked (5+ attempts)
      if (passwordSecurity.resetAttemptCount >= AUTH.PASSWORD_RESET.MAX_ATTEMPTS) {
        log.info(
          {
            userId: user.id,
            email: normalizedEmail,
            attempts: passwordSecurity.resetAttemptCount,
          },
          'Password reset locked - too many attempts'
        );

        // Clear OTP fields when locked
        await this.passwordSecurityRepo.clearResetOtp(user.id);

        await this.auditRepo.logPasswordResetFailed({
          userId: user.id,
          email: normalizedEmail,
          reason: 'locked',
          attemptCount: passwordSecurity.resetAttemptCount,
          locked: true,
          ipAddress: context.ipAddress,
          userAgent: context.userAgent,
        });

        throw new InvalidResetCodeError();
      }

      // Step 6: Check OTP expiry
      if (passwordSecurity.resetOtpExpiresAt && passwordSecurity.resetOtpExpiresAt < new Date()) {
        log.info(
          {
            userId: user.id,
            email: normalizedEmail,
            expiredAt: passwordSecurity.resetOtpExpiresAt,
          },
          'Password reset attempted with expired code'
        );

        // Increment attempts for expired code
        const updated = await this.passwordSecurityRepo.incrementResetAttempts(user.id);

        await this.auditRepo.logPasswordResetFailed({
          userId: user.id,
          email: normalizedEmail,
          reason: 'expired_code',
          attemptCount: updated.resetAttemptCount,
          locked: updated.resetAttemptCount >= AUTH.PASSWORD_RESET.MAX_ATTEMPTS,
          ipAddress: context.ipAddress,
          userAgent: context.userAgent,
        });

        throw new InvalidResetCodeError();
      }

      // Step 7: Validate OTP
      const otpHash = hashOTP(otp);
      if (otpHash !== passwordSecurity.resetOtpHash) {
        log.info(
          { userId: user.id, email: normalizedEmail },
          'Password reset attempted with invalid code'
        );

        // Increment attempts
        const updated = await this.passwordSecurityRepo.incrementResetAttempts(user.id);

        // Check if now locked
        if (updated.resetAttemptCount >= AUTH.PASSWORD_RESET.MAX_ATTEMPTS) {
          log.warn(
            { userId: user.id, attempts: updated.resetAttemptCount },
            'Account locked after max reset attempts'
          );
          // Clear OTP fields
          await this.passwordSecurityRepo.clearResetOtp(user.id);
        }

        await this.auditRepo.logPasswordResetFailed({
          userId: user.id,
          email: normalizedEmail,
          reason: 'invalid_code',
          attemptCount: updated.resetAttemptCount,
          locked: updated.resetAttemptCount >= AUTH.PASSWORD_RESET.MAX_ATTEMPTS,
          ipAddress: context.ipAddress,
          userAgent: context.userAgent,
        });

        throw new InvalidResetCodeError();
      }

      log.debug({ userId: user.id }, 'OTP validated successfully');

      // Step 8: Hash new password
      const passwordHash = await hashPassword(newPassword);

      log.debug({ userId: user.id }, 'New password hashed');

      // Step 9: Database transaction
      const wasEmailVerified = user.emailVerified;

      await this.prisma.$transaction(async (tx) => {
        // Update user password and verify email
        await this.userRepo.resetPasswordAndVerifyEmail(user.id, passwordHash, tx);

        // Complete password reset in security table
        await this.passwordSecurityRepo.completePasswordReset(user.id, tx);

        // Revoke all refresh tokens
        const revokedCount = await this.refreshTokenRepo.revokeAllUserTokens(
          user.id,
          AUTH.REVOCATION_REASONS.PASSWORD_RESET,
          tx
        );

        log.debug({ userId: user.id, revokedCount }, 'Revoked all user tokens');

        // Audit log success
        await this.auditRepo.logPasswordResetSuccess({
          userId: user.id,
          email: normalizedEmail,
          emailAutoVerified: !wasEmailVerified,
          ipAddress: context.ipAddress,
          userAgent: context.userAgent,
        });
      });

      log.debug({ userId: user.id }, 'Password reset transaction completed');

      // Step 10: Queue success email (outside transaction)
      try {
        const firstName = user.profile?.firstName ?? 'User';

        await emailQueue.add('password-reset-success', {
          to: normalizedEmail,
          subject: 'Password Reset Successful',
          template: 'password-reset-success',
          data: {
            firstName,
            email: normalizedEmail,
            resetTime: new Date().toISOString(),
            ipAddress: context.ipAddress,
            emailWasVerified: !wasEmailVerified,
            companyName: 'Cotizate',
            supportEmail: 'support@cotizate.com',
          },
        });

        log.debug(
          { userId: user.id, email: normalizedEmail },
          'Password reset success email queued'
        );
      } catch (queueError) {
        // Log error but don't fail the request
        log.error(
          { error: queueError, email: normalizedEmail, userId: user.id },
          'Failed to queue password reset success email'
        );
        // Continue - password was reset successfully even if email failed
      }

      log.info(
        {
          userId: user.id,
          email: normalizedEmail,
          emailAutoVerified: !wasEmailVerified,
        },
        'Password reset completed successfully'
      );

      // Return response with email verification info if it was auto-verified
      const response: ResetPasswordResponseDto = {
        success: true,
        message: 'Password reset successfully',
      };

      if (!wasEmailVerified) {
        response.data = { emailVerified: true };
      }

      return response;
    } catch (error) {
      // Re-throw known errors
      if (error instanceof InvalidResetCodeError) {
        throw error;
      }

      log.error(
        {
          error: error instanceof Error ? error.message : 'Unknown error',
          email: normalizedEmail,
        },
        'Unexpected error during password reset'
      );

      // For genuine system errors, throw the error
      if (error instanceof Error && error.message.includes('database')) {
        throw new PasswordResetFailedError('Database error during password reset');
      }

      // For unexpected errors, throw generic error
      throw new PasswordResetFailedError('Unexpected error during password reset');
    }
  }
}
