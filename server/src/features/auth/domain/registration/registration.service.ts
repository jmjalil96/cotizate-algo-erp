import { createHash } from 'node:crypto';

import { Prisma, PrismaClient } from '@prisma/client';

import { env } from '../../../../config/env.js';
import { logger } from '../../../../config/logger.js';
import { emailQueue } from '../../../../email/queue.js';
import { AuditLogRepository } from '../../repositories/audit-log.repository.js';
import { EmailVerificationTokenRepository } from '../../repositories/email-verification-token.repository.js';
import { OrganizationRepository } from '../../repositories/organization.repository.js';
import { OtpAttemptRepository } from '../../repositories/otp-attempt.repository.js';
import { ProfileRepository } from '../../repositories/profile.repository.js';
import { RoleRepository } from '../../repositories/role.repository.js';
import { UserRoleRepository } from '../../repositories/user-role.repository.js';
import { UserRepository } from '../../repositories/user.repository.js';
import { generateOTP, hashOTP, getOTPExpiryDate } from '../../shared/utils/otp.util.js';
import { hashPassword } from '../../shared/utils/password.util.js';
import { generateUniqueSlug } from '../../shared/utils/slug.util.js';

import {
  EmailAlreadyExistsError,
  OrganizationSlugExistsError,
  RegistrationFailedError,
} from './registration.errors.js';

import type { RegisterRequestDto, RegisterResponseDto } from './registration.dto.js';
import type { Logger } from 'pino';


export class RegistrationService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly userRepo: UserRepository,
    private readonly orgRepo: OrganizationRepository,
    private readonly profileRepo: ProfileRepository,
    private readonly roleRepo: RoleRepository,
    private readonly userRoleRepo: UserRoleRepository,
    private readonly emailTokenRepo: EmailVerificationTokenRepository,
    private readonly auditRepo: AuditLogRepository,
    private readonly otpAttemptRepo: OtpAttemptRepository
  ) {}

  async register(
    dto: RegisterRequestDto,
    context?: { ipAddress?: string; userAgent?: string; logger?: Logger }
  ): Promise<RegisterResponseDto> {
    // Use context logger if available, fallback to module logger
    const log = context?.logger ?? logger;
    const { email, password, firstName, lastName, organizationName } = dto;
    const normalizedEmail = email.toLowerCase();
    
    log.debug({ email: normalizedEmail, organizationName }, 'Starting registration process');

    // Step 1: Check if email already exists
    const existingUser = await this.userRepo.findByEmail(normalizedEmail);
    
    if (existingUser) {
      log.warn(
        { email: normalizedEmail, existingUserId: existingUser.id },
        'Registration attempt with existing email'
      );
      
      // Send "already registered" email in try-catch to prevent failures
      try {
        await emailQueue.add('already-registered', {
          to: normalizedEmail,
          subject: 'Account Already Exists',
          template: 'already-registered',
          data: {
            email: normalizedEmail,
            loginUrl: `${env.FRONTEND_URL}/login`,
            resetPasswordUrl: `${env.FRONTEND_URL}/reset-password`,
            ipAddress: context?.ipAddress,
            requestTime: new Date().toISOString(),
          },
        });
        log.debug({ email: normalizedEmail }, 'Already-registered email queued');
      } catch (queueError) {
        log.error({ error: queueError, email: normalizedEmail }, 'Failed to queue already-registered email');
        // Continue anyway to prevent enumeration
      }

      // Generate deterministic fake IDs from email hash (not real IDs!)
      const emailHash = createHash('sha256').update(normalizedEmail).digest('hex');
      const fakeUserId = `${emailHash.slice(0, 8)}-${emailHash.slice(8, 12)}-${emailHash.slice(12, 16)}-${emailHash.slice(16, 20)}-${emailHash.slice(20, 32)}`;
      const fakeOrgId = `${emailHash.slice(32, 40)}-${emailHash.slice(40, 44)}-${emailHash.slice(44, 48)}-${emailHash.slice(48, 52)}-${emailHash.slice(52, 64)}`;

      // Return success with fake IDs to prevent enumeration attacks
      return {
        success: true,
        message: 'Registration successful. Please check your email for verification code.',
        data: {
          userId: fakeUserId,
          organizationId: fakeOrgId,
          email: normalizedEmail,
        },
      };
    }

    // Step 2: Generate unique organization slug
    log.debug({ organizationName }, 'Generating organization slug');
    let slug: string;
    try {
      slug = await generateUniqueSlug(
        organizationName,
        (s) => this.orgRepo.existsBySlug(s)
      );
      log.debug({ organizationName, slug }, 'Organization slug generated successfully');
    } catch (error) {
      log.error({ error, organizationName }, 'Failed to generate unique organization slug');
      throw error; // Let the OrganizationSlugExistsError bubble up
    }

    // Step 3: Prepare data
    log.debug('Preparing registration data');
    const passwordHash = await hashPassword(password);
    const ownerRole = await this.roleRepo.findOwnerRole();
    const otp = generateOTP();
    const otpHash = hashOTP(otp);
    const otpExpiresAt = getOTPExpiryDate();

    // Step 4: Database transaction
    log.debug('Starting registration transaction');
    try {
      const result = await this.prisma.$transaction(async (tx) => {
        // Create organization
        log.debug({ organizationName, slug }, 'Creating organization');
        const organization = await this.orgRepo.create(
          { name: organizationName, slug },
          tx
        );

        // Create user
        log.debug({ email: normalizedEmail, organizationId: organization.id }, 'Creating user');
        const user = await this.userRepo.create(
          {
            email: normalizedEmail,
            passwordHash,
            organizationId: organization.id,
          },
          tx
        );

        // Create profile
        log.debug({ userId: user.id, firstName, lastName }, 'Creating user profile');
        await this.profileRepo.create(
          {
            userId: user.id,
            firstName,
            lastName,
          },
          tx
        );

        // Assign owner role
        log.debug({ userId: user.id, roleId: ownerRole.id }, 'Assigning owner role');
        await this.userRoleRepo.assignRole(
          {
            userId: user.id,
            roleId: ownerRole.id,
          },
          tx
        );

        // Invalidate any existing tokens
        log.debug({ userId: user.id }, 'Managing verification tokens');
        await this.emailTokenRepo.invalidateAllForUser(user.id, tx);

        // Create new verification token
        await this.emailTokenRepo.create(
          {
            userId: user.id,
            tokenHash: otpHash,
            expiresAt: otpExpiresAt,
          },
          tx
        );

        // Create OTP attempt record for user
        log.debug({ userId: user.id }, 'Creating OTP attempt record');
        await this.otpAttemptRepo.create(user.id, tx);

        // Log registration
        log.debug({ userId: user.id }, 'Creating audit log entry');
        await this.auditRepo.logRegistration(
          {
            userId: user.id,
            organizationId: organization.id,
            email: normalizedEmail,
            ...(context?.ipAddress && { ipAddress: context.ipAddress }),
            ...(context?.userAgent && { userAgent: context.userAgent }),
          },
          tx
        );

        return { user, organization };
      });
      
      log.debug(
        { userId: result.user.id, organizationId: result.organization.id },
        'Registration transaction completed successfully'
      );

      // Step 5: Queue verification email (outside transaction)
      try {
        await emailQueue.add('registration-verification', {
          to: normalizedEmail,
          subject: 'Verify Your Email Address',
          template: 'registration-success',
          data: {
            firstName,
            otpCode: otp, // Send unhashed OTP
            organizationName,
            email: normalizedEmail,
            companyName: 'Cotizate',
            expiryMinutes: 10,
            ipAddress: context?.ipAddress,
            requestTime: new Date().toISOString(),
          },
        });
        
        log.debug({ email: normalizedEmail }, 'Verification email queued');
      } catch (queueError) {
        // Log error but don't fail registration - user can request resend later
        log.error(
          { error: queueError, email: normalizedEmail, userId: result.user.id },
          'Failed to queue verification email after successful registration'
        );
        // Continue - registration was successful even if email failed
      }
      
      log.info(
        { 
          userId: result.user.id,
          organizationId: result.organization.id,
          email: normalizedEmail,
          organizationSlug: result.organization.slug
        },
        'User registration successful'
      );

      // Step 6: Return success response
      return {
        success: true,
        message: 'Registration successful. Please check your email for verification code.',
        data: {
          userId: result.user.id,
          organizationId: result.organization.id,
          email: normalizedEmail,
        },
      };
    } catch (error) {
      // Check for unique constraint violation (race condition)
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        log.warn(
          { 
            email: normalizedEmail,
            field: error.meta?.['target'],
            code: error.code
          },
          'Unique constraint violation during registration - likely race condition'
        );
        
        // Treat as duplicate email - return success to prevent enumeration
        const emailHash = createHash('sha256').update(normalizedEmail).digest('hex');
        const fakeUserId = `${emailHash.slice(0, 8)}-${emailHash.slice(8, 12)}-${emailHash.slice(12, 16)}-${emailHash.slice(16, 20)}-${emailHash.slice(20, 32)}`;
        const fakeOrgId = `${emailHash.slice(32, 40)}-${emailHash.slice(40, 44)}-${emailHash.slice(44, 48)}-${emailHash.slice(48, 52)}-${emailHash.slice(52, 64)}`;
        
        return {
          success: true,
          message: 'Registration successful. Please check your email for verification code.',
          data: {
            userId: fakeUserId,
            organizationId: fakeOrgId,
            email: normalizedEmail,
          },
        };
      }
      
      log.error(
        { 
          error: error instanceof Error ? error.message : 'Unknown error',
          email: normalizedEmail,
          organizationName
        },
        'Registration transaction failed'
      );
      
      if (error instanceof EmailAlreadyExistsError || 
          error instanceof OrganizationSlugExistsError) {
        throw error;
      }
      
      throw new RegistrationFailedError('Unable to complete registration. Please try again.');
    }
  }
}