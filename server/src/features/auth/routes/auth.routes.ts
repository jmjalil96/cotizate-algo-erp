import { PrismaClient } from '@prisma/client';
import { Router } from 'express';

import { prisma } from '../../../config/database.js';
import { PasswordController } from '../domain/password/password.controller.js';
import { RegistrationController } from '../domain/registration/registration.controller.js';
import { SessionController } from '../domain/session/session.controller.js';
import { ServiceFactory } from '../services/service.factory.js';

/**
 * Create auth routes with dependency injection
 */
export function createAuthRoutes(prismaClient: PrismaClient = prisma): Router {
  const router = Router();

  // Initialize service factory
  const factory = new ServiceFactory(prismaClient);

  // Initialize controllers with services from factory
  const registrationController = new RegistrationController(
    factory.getRegistrationService(),
    factory.getEmailVerificationService(),
    factory.getResendVerificationService()
  );

  const sessionController = new SessionController(
    factory.getLoginService(),
    factory.getRefreshService(),
    factory.getLogoutService(),
    factory.getMeService()
  );

  const passwordController = new PasswordController(
    factory.getForgotPasswordService(),
    factory.getResetPasswordService()
  );

  // Define routes
  router.post('/register', ...registrationController.registerMiddleware);
  router.post('/verify-email', ...registrationController.verifyEmailMiddleware);
  router.post('/resend-verification', ...registrationController.resendVerificationMiddleware);
  router.post('/login', ...sessionController.loginMiddleware);
  router.post('/refresh', ...sessionController.refreshMiddleware);
  router.post('/logout', ...sessionController.logoutMiddleware);
  router.get('/me', ...sessionController.meMiddleware);
  router.post('/forgot-password', ...passwordController.forgotPasswordMiddleware);
  router.post('/reset-password', ...passwordController.resetPasswordMiddleware);

  return router;
}

// Export default instance for standard use
export default createAuthRoutes();
