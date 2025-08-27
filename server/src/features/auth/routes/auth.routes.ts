import { PrismaClient } from '@prisma/client';
import { Router } from 'express';

import { prisma } from '../../../config/database.js';
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
    factory.getEmailVerificationService()
  );

  const sessionController = new SessionController(
    factory.getLoginService(),
    factory.getRefreshService()
  );

  // Define routes
  router.post('/register', ...registrationController.registerMiddleware);
  router.post('/verify-email', ...registrationController.verifyEmailMiddleware);
  router.post('/login', ...sessionController.loginMiddleware);
  router.post('/refresh', ...sessionController.refreshMiddleware);
  // router.post('/logout', ...logoutController.logoutMiddleware);

  return router;
}

// Export default instance for standard use
export default createAuthRoutes();
