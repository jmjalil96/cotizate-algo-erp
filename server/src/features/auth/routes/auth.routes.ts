import { PrismaClient } from '@prisma/client';
import { Router } from 'express';

import { prisma } from '../../../config/database.js';
import { EmailVerificationService } from '../domain/registration/email-verification.service.js';
import { RegistrationController } from '../domain/registration/registration.controller.js';
import { RegistrationService } from '../domain/registration/registration.service.js';
import { AuditLogRepository } from '../repositories/audit-log.repository.js';
import { EmailVerificationTokenRepository } from '../repositories/email-verification-token.repository.js';
import { OrganizationRepository } from '../repositories/organization.repository.js';
import { OtpAttemptRepository } from '../repositories/otp-attempt.repository.js';
import { ProfileRepository } from '../repositories/profile.repository.js';
import { RoleRepository } from '../repositories/role.repository.js';
import { UserRoleRepository } from '../repositories/user-role.repository.js';
import { UserRepository } from '../repositories/user.repository.js';

/**
 * Create auth routes with dependency injection
 */
export function createAuthRoutes(prismaClient: PrismaClient = prisma): Router {
  const router = Router();
  
  // Initialize repositories
  const userRepo = new UserRepository(prismaClient);
  const orgRepo = new OrganizationRepository(prismaClient);
  const profileRepo = new ProfileRepository(prismaClient);
  const roleRepo = new RoleRepository(prismaClient);
  const userRoleRepo = new UserRoleRepository(prismaClient);
  const emailTokenRepo = new EmailVerificationTokenRepository(prismaClient);
  const auditRepo = new AuditLogRepository(prismaClient);
  const otpAttemptRepo = new OtpAttemptRepository(prismaClient);
  
  // Initialize registration service with all dependencies
  const registrationService = new RegistrationService(
    prismaClient,
    userRepo,
    orgRepo,
    profileRepo,
    roleRepo,
    userRoleRepo,
    emailTokenRepo,
    auditRepo,
    otpAttemptRepo
  );
  
  // Initialize email verification service
  const emailVerificationService = new EmailVerificationService(
    prismaClient,
    userRepo,
    emailTokenRepo,
    otpAttemptRepo,
    auditRepo
  );
  
  // Initialize registration controller
  const registrationController = new RegistrationController(
    registrationService,
    emailVerificationService
  );
  
  // Define routes
  router.post('/register', ...registrationController.registerMiddleware);
  router.post('/verify-email', ...registrationController.verifyEmailMiddleware);
  // router.post('/login', ...loginController.loginMiddleware);
  // router.post('/refresh', ...refreshController.refreshMiddleware);
  // router.post('/logout', ...logoutController.logoutMiddleware);
  
  return router;
}

// Export default instance for standard use
export default createAuthRoutes();