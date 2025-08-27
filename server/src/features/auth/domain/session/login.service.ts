import { PrismaClient } from '@prisma/client';

import { logger } from '../../../../config/logger.js';
import { emailQueue } from '../../../../email/queue.js';
import { AuditLogRepository } from '../../repositories/audit-log.repository.js';
import { LoginSecurityRepository } from '../../repositories/login-security.repository.js';
import { RefreshTokenRepository } from '../../repositories/refresh-token.repository.js';
import { UserRepository } from '../../repositories/user.repository.js';
import { AUTH } from '../../shared/auth.constants.js';
import { parseDeviceName, generateFamilyId } from '../../shared/utils/device.util.js';
import {
  generateAccessToken,
  generateRefreshToken,
  hashRefreshToken,
  getRefreshTokenExpiry,
  generateJti,
  parseExpiryToSeconds,
} from '../../shared/utils/jwt.util.js';
import { generateOTP, hashOTP, getOTPExpiryDate } from '../../shared/utils/otp.util.js';
import { verifyPassword, getDummyPasswordHash } from '../../shared/utils/password.util.js';

import {
  InvalidCredentialsError,
  EmailNotVerifiedError,
  AccountInactiveError,
  InvalidOtpError,
  OtpRequiredError,
  LoginFailedError,
} from './session.errors.js';

import type {
  LoginRequestDto,
  LoginResponseDto,
  SessionContext,
  TokenPair,
  JwtPayload,
} from './session.dto.js';

export class LoginService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly userRepo: UserRepository,
    private readonly loginSecurityRepo: LoginSecurityRepository,
    private readonly refreshTokenRepo: RefreshTokenRepository,
    private readonly auditRepo: AuditLogRepository
  ) {}

  async login(
    dto: LoginRequestDto,
    context: SessionContext
  ): Promise<{ response: LoginResponseDto; tokens?: TokenPair }> {
    const log = context.logger ?? logger;
    const { email, password, otp } = dto;
    const normalizedEmail = email.toLowerCase();

    log.debug({ email: normalizedEmail, hasOtp: !!otp }, 'Login attempt started');

    // Extract device information
    const deviceName = dto.deviceName ?? parseDeviceName(context.userAgent);
    const deviceFingerprint = context.deviceFingerprint;

    // Step 1: Fetch user with full details
    log.debug({ email: normalizedEmail }, 'Fetching user details');
    const user = await this.userRepo.findWithDetails(normalizedEmail);

    if (!user) {
      // Timing-safe password check to prevent enumeration
      log.debug({ email: normalizedEmail }, 'User not found, performing dummy password check');
      await verifyPassword(password, getDummyPasswordHash());

      log.warn(
        { email: normalizedEmail, ipAddress: context.ipAddress },
        'Login attempt for non-existent user'
      );
      throw new InvalidCredentialsError();
    }

    // Step 2: Check user is active
    if (!user.isActive) {
      log.warn({ userId: user.id, email: normalizedEmail }, 'Login attempt for inactive user');
      throw new AccountInactiveError();
    }

    // Step 3: Check organization is active
    if (!user.organization.isActive) {
      log.warn(
        { userId: user.id, organizationId: user.organizationId, email: normalizedEmail },
        'Login attempt for user in inactive organization'
      );
      throw new AccountInactiveError(); // Same generic message as user inactive
    }

    // Step 4: Verify password FIRST (before revealing email verification status)
    log.debug({ userId: user.id }, 'Verifying password');
    const isValidPassword = await verifyPassword(password, user.passwordHash);

    if (!isValidPassword) {
      log.warn(
        { userId: user.id, email: normalizedEmail, ipAddress: context.ipAddress },
        'Invalid password provided'
      );

      // Increment failed login count
      await this.loginSecurityRepo.incrementFailedLogin(user.id);

      throw new InvalidCredentialsError();
    }

    // Step 5: Check email is verified (only AFTER password is confirmed valid)
    if (!user.emailVerified) {
      log.warn({ userId: user.id, email: normalizedEmail }, 'Login attempt with unverified email');
      throw new EmailNotVerifiedError();
    }

    // Step 6: Check if OTP is required
    log.debug({ userId: user.id }, 'Checking OTP requirement');
    const loginSecurity = await this.loginSecurityRepo.findByUserId(user.id);

    if (!loginSecurity) {
      log.error({ userId: user.id }, 'LoginSecurity record not found for user');
      throw new LoginFailedError('Security configuration missing');
    }

    // Step 7: Handle OTP requirement
    if (loginSecurity.requiresOtp) {
      if (!otp) {
        // Generate and send OTP
        log.info({ userId: user.id, email: normalizedEmail }, 'OTP required, generating new OTP');

        const newOtp = generateOTP();
        const otpHash = hashOTP(newOtp);
        const otpExpiresAt = getOTPExpiryDate();

        // Store OTP hash in LoginSecurity
        await this.loginSecurityRepo.setLoginOtp(user.id, otpHash, otpExpiresAt);

        // Queue OTP email
        try {
          await emailQueue.add('login-otp', {
            to: normalizedEmail,
            subject: 'Login Verification Code',
            template: 'login-otp',
            data: {
              firstName: user.profile.firstName,
              otpCode: newOtp,
              expiryMinutes: AUTH.OTP.EXPIRY_MINUTES,
              maxAttempts: AUTH.LOGIN.MAX_ATTEMPTS,
              ipAddress: context.ipAddress,
              deviceName,
              requestTime: new Date().toLocaleString(),
            },
          });

          log.debug({ userId: user.id, email: normalizedEmail }, 'Login OTP email queued');
        } catch (queueError) {
          log.error(
            { error: queueError, userId: user.id, email: normalizedEmail },
            'Failed to queue login OTP email'
          );
          throw new LoginFailedError('Unable to send verification code');
        }

        throw new OtpRequiredError(); // Controller will return 200 with requiresOtp: true
      }

      // Verify provided OTP
      log.debug({ userId: user.id }, 'Verifying provided OTP');

      // Check OTP exists
      if (!loginSecurity.loginOtpHash) {
        log.warn({ userId: user.id }, 'OTP verification attempted but no OTP hash found');
        throw new InvalidOtpError();
      }

      // Check OTP not expired
      if (!loginSecurity.loginOtpExpiresAt || new Date() > loginSecurity.loginOtpExpiresAt) {
        log.warn({ userId: user.id }, 'OTP verification attempted with expired OTP');
        throw new InvalidOtpError();
      }

      // Verify OTP hash
      const providedOtpHash = hashOTP(otp);
      if (providedOtpHash !== loginSecurity.loginOtpHash) {
        log.warn({ userId: user.id }, 'Invalid OTP provided');
        throw new InvalidOtpError();
      }

      log.info({ userId: user.id }, 'OTP verified successfully');
    }

    // Step 8: Successful login - create tokens and update records
    log.info({ userId: user.id, email: normalizedEmail }, 'Login successful, creating session');

    try {
      const result = await this.prisma.$transaction(async (tx) => {
        // Format permissions for JWT
        const permissions = user.userRole.role.rolePermissions.map(
          (rp) => `${rp.permission.resource}:${rp.permission.action}:${rp.permission.scope}`
        );

        // Generate JWT access token
        const jwtPayload: JwtPayload = {
          sub: user.id,
          email: user.email,
          org: user.organizationId,
          role: user.userRole.role.id,
          permissions,
          jti: generateJti(),
        };
        const accessToken = generateAccessToken(jwtPayload);

        // Generate refresh token
        const refreshToken = generateRefreshToken();
        const refreshTokenHash = hashRefreshToken(refreshToken);
        const refreshExpiresAt = getRefreshTokenExpiry();
        const familyId = generateFamilyId();

        // Create refresh token record
        await this.refreshTokenRepo.create(
          {
            userId: user.id,
            tokenHash: refreshTokenHash,
            familyId,
            deviceName,
            deviceFingerprint,
            ipAddress: context.ipAddress,
            userAgent: context.userAgent,
            expiresAt: refreshExpiresAt,
          },
          tx
        );

        // Reset login security
        await this.loginSecurityRepo.handleSuccessfulLogin(user.id, context.ipAddress, tx);

        // Create audit log
        await this.auditRepo.logLogin(
          {
            userId: user.id,
            email: normalizedEmail,
            ipAddress: context.ipAddress,
            userAgent: context.userAgent,
            deviceName,
          },
          tx
        );

        return {
          accessToken,
          refreshToken,
          accessExpiresIn: parseExpiryToSeconds(AUTH.ACCESS_TOKEN.EXPIRES),
          refreshExpiresIn: parseExpiryToSeconds(AUTH.REFRESH_TOKEN.EXPIRES),
        };
      });

      log.info(
        {
          userId: user.id,
          email: normalizedEmail,
          organizationId: user.organizationId,
          deviceName,
        },
        'Login session created successfully'
      );

      // Build response
      const response: LoginResponseDto = {
        success: true,
        message: 'Login successful',
        data: {
          userId: user.id,
          email: user.email,
          organizationId: user.organizationId,
          firstName: user.profile.firstName,
          lastName: user.profile.lastName,
          role: {
            id: user.userRole.role.id,
            name: user.userRole.role.name,
            description: user.userRole.role.description,
          },
          permissions: user.userRole.role.rolePermissions.map((rp) => ({
            resource: rp.permission.resource,
            action: rp.permission.action,
            scope: rp.permission.scope,
          })),
        },
      };

      return { response, tokens: result };
    } catch (error) {
      log.error(
        {
          error: error instanceof Error ? error.message : 'Unknown error',
          userId: user.id,
          email: normalizedEmail,
        },
        'Failed to create login session'
      );

      throw new LoginFailedError('Unable to create session');
    }
  }
}
