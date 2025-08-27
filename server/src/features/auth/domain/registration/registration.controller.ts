import { Request, Response, NextFunction, RequestHandler } from 'express';

import { createRequestLogger } from '../../../../config/logger.js';
import { validateRequest } from '../../../../config/middleware/request.js';

import { EmailVerificationService } from './email-verification.service.js';
import { RegistrationService } from './registration.service.js';
import { registerSchema, verifyEmailSchema } from './registration.validator.js';

export class RegistrationController {
  constructor(
    private readonly registrationService: RegistrationService,
    private readonly emailVerificationService: EmailVerificationService
  ) {}

  /**
   * Middleware chain for registration endpoint
   */
  get registerMiddleware(): RequestHandler[] {
    return [
      validateRequest(registerSchema),
      this.register.bind(this),
    ];
  }

  /**
   * Handle registration request
   */
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    const logger = createRequestLogger(req.requestId);
    const dto = req.body; // Extract validated body (already validated by middleware)
    
    try {
      // Log registration attempt (no password)
      logger.info(
        { email: dto.email, organizationName: dto.organizationName },
        'Registration attempt'
      );
      
      // Get context data for security tracking
      const ipAddress = req.ip ?? req.socket.remoteAddress;
      const userAgent = req.headers['user-agent'];
      
      const context = {
        ...(ipAddress && { ipAddress }),
        ...(userAgent && { userAgent }),
        logger, // Pass logger to service
      };

      // Call service
      const result = await this.registrationService.register(dto, context);
      
      // Log successful registration
      logger.info(
        { 
          userId: result.data.userId,
          organizationId: result.data.organizationId,
          email: result.data.email
        },
        'Registration completed successfully'
      );

      // Send success response
      res.status(201).json(result);
    } catch (error) {
      // Pass to central error handler middleware (which will log it)
      next(error);
    }
  }

  /**
   * Middleware chain for email verification endpoint
   */
  get verifyEmailMiddleware(): RequestHandler[] {
    return [
      validateRequest(verifyEmailSchema),
      this.verifyEmail.bind(this),
    ];
  }

  /**
   * Handle email verification request
   */
  async verifyEmail(req: Request, res: Response, _next: NextFunction): Promise<void> {
    const logger = createRequestLogger(req.requestId);
    const dto = req.body; // Extract validated body (already validated by middleware)
    
    try {
      // Log verification attempt
      logger.info({ email: dto.email }, 'Email verification attempt');
      
      // Get context data for security tracking
      const ipAddress = req.ip ?? req.socket.remoteAddress;
      const userAgent = req.headers['user-agent'];
      
      const context = {
        ...(ipAddress && { ipAddress }),
        ...(userAgent && { userAgent }),
        logger, // Pass logger to service
      };

      // Call service - will throw specific errors internally
      await this.emailVerificationService.verifyEmail(dto, context);
      
      // If we reach here, verification was successful
      logger.info({ email: dto.email }, 'Email verification successful');
      
      // Always return generic success
      res.status(200).json({
        success: true,
        message: 'Email verified successfully',
      });
    } catch (error) {
      // Log the actual error internally
      logger.error(
        { 
          error: error instanceof Error ? error.message : 'Unknown error',
          email: dto.email
        },
        'Email verification failed'
      );
      
      // CRITICAL: Always return same generic failure response (security)
      res.status(200).json({
        success: false,
        message: 'Invalid or expired verification code',
      });
    }
  }
}