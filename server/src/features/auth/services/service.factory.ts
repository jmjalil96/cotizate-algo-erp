import { PrismaClient } from '@prisma/client';

import { EmailVerificationService } from '../domain/registration/email-verification.service.js';
import { RegistrationService } from '../domain/registration/registration.service.js';
import { LoginService } from '../domain/session/login.service.js';
import { RefreshService } from '../domain/session/refresh.service.js';
import { AuditLogRepository } from '../repositories/audit-log.repository.js';
import { EmailVerificationTokenRepository } from '../repositories/email-verification-token.repository.js';
import { LoginSecurityRepository } from '../repositories/login-security.repository.js';
import { OrganizationRepository } from '../repositories/organization.repository.js';
import { OtpAttemptRepository } from '../repositories/otp-attempt.repository.js';
import { ProfileRepository } from '../repositories/profile.repository.js';
import { RefreshTokenRepository } from '../repositories/refresh-token.repository.js';
import { RoleRepository } from '../repositories/role.repository.js';
import { UserRoleRepository } from '../repositories/user-role.repository.js';
import { UserRepository } from '../repositories/user.repository.js';

/**
 * Factory for creating auth services with proper dependency injection
 * Uses lazy initialization and singleton pattern for repositories
 */
export class ServiceFactory {
  // Repository instances (lazy-loaded singletons)
  private userRepo?: UserRepository;
  private orgRepo?: OrganizationRepository;
  private profileRepo?: ProfileRepository;
  private roleRepo?: RoleRepository;
  private userRoleRepo?: UserRoleRepository;
  private emailTokenRepo?: EmailVerificationTokenRepository;
  private auditRepo?: AuditLogRepository;
  private otpAttemptRepo?: OtpAttemptRepository;
  private loginSecurityRepo?: LoginSecurityRepository;
  private refreshTokenRepo?: RefreshTokenRepository;

  constructor(private readonly prisma: PrismaClient) {}

  // Repository getters (singleton pattern)

  getUserRepository(): UserRepository {
    this.userRepo ??= new UserRepository(this.prisma);
    return this.userRepo;
  }

  getOrganizationRepository(): OrganizationRepository {
    this.orgRepo ??= new OrganizationRepository(this.prisma);
    return this.orgRepo;
  }

  getProfileRepository(): ProfileRepository {
    this.profileRepo ??= new ProfileRepository(this.prisma);
    return this.profileRepo;
  }

  getRoleRepository(): RoleRepository {
    this.roleRepo ??= new RoleRepository(this.prisma);
    return this.roleRepo;
  }

  getUserRoleRepository(): UserRoleRepository {
    this.userRoleRepo ??= new UserRoleRepository(this.prisma);
    return this.userRoleRepo;
  }

  getEmailVerificationTokenRepository(): EmailVerificationTokenRepository {
    this.emailTokenRepo ??= new EmailVerificationTokenRepository(this.prisma);
    return this.emailTokenRepo;
  }

  getAuditLogRepository(): AuditLogRepository {
    this.auditRepo ??= new AuditLogRepository(this.prisma);
    return this.auditRepo;
  }

  getOtpAttemptRepository(): OtpAttemptRepository {
    this.otpAttemptRepo ??= new OtpAttemptRepository(this.prisma);
    return this.otpAttemptRepo;
  }

  getLoginSecurityRepository(): LoginSecurityRepository {
    this.loginSecurityRepo ??= new LoginSecurityRepository(this.prisma);
    return this.loginSecurityRepo;
  }

  getRefreshTokenRepository(): RefreshTokenRepository {
    this.refreshTokenRepo ??= new RefreshTokenRepository(this.prisma);
    return this.refreshTokenRepo;
  }

  // Service factory methods (new instance each time for clean state)

  getRegistrationService(): RegistrationService {
    return new RegistrationService(
      this.prisma,
      this.getUserRepository(),
      this.getOrganizationRepository(),
      this.getProfileRepository(),
      this.getRoleRepository(),
      this.getUserRoleRepository(),
      this.getEmailVerificationTokenRepository(),
      this.getAuditLogRepository(),
      this.getOtpAttemptRepository(),
      this.getLoginSecurityRepository()
    );
  }

  getEmailVerificationService(): EmailVerificationService {
    return new EmailVerificationService(
      this.prisma,
      this.getUserRepository(),
      this.getEmailVerificationTokenRepository(),
      this.getOtpAttemptRepository(),
      this.getAuditLogRepository()
    );
  }

  getLoginService(): LoginService {
    return new LoginService(
      this.prisma,
      this.getUserRepository(),
      this.getLoginSecurityRepository(),
      this.getRefreshTokenRepository(),
      this.getAuditLogRepository()
    );
  }

  getRefreshService(): RefreshService {
    return new RefreshService(
      this.prisma,
      this.getRefreshTokenRepository(),
      this.getAuditLogRepository()
    );
  }
}
