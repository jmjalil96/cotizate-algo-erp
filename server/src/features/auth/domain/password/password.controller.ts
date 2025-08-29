import { Request, Response, NextFunction, RequestHandler } from 'express';

import { createRequestLogger } from '../../../../config/logger.js';
import { validateRequest } from '../../../../config/middleware/request.js';

import { ForgotPasswordService } from './forgot-password.service.js';
import { forgotPasswordSchema, resetPasswordSchema } from './password.validator.js';
import { ResetPasswordService } from './reset-password.service.js';

export class PasswordController {
  constructor(
    private readonly forgotPasswordService: ForgotPasswordService,
    private readonly resetPasswordService: ResetPasswordService
  ) {}

  /**
   * Middleware chain for forgot password endpoint
   */
  get forgotPasswordMiddleware(): RequestHandler[] {
    return [validateRequest(forgotPasswordSchema), this.forgotPassword.bind(this)];
  }

  /**
   * Handle forgot password request
   */
  async forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    const logger = createRequestLogger(req.requestId);
    const dto = req.body; // Extract validated body (already validated by middleware)

    try {
      // Log password reset attempt (no sensitive data)
      logger.info({ email: dto.email }, 'Password reset request attempt');

      // Get context data for security tracking
      const ipAddress = req.ip ?? req.socket.remoteAddress;
      const userAgent = req.headers['user-agent'];

      const context = {
        ipAddress: ipAddress ?? 'unknown',
        userAgent: userAgent ?? 'unknown',
        logger, // Pass logger to service
      };

      // Call service
      const result = await this.forgotPasswordService.forgotPassword(dto, context);

      // Log successful request (generic for security)
      logger.info({ email: dto.email }, 'Password reset request processed');

      // Send success response (always 200 for anti-enumeration)
      res.status(200).json(result);
    } catch (error) {
      // Pass to central error handler middleware (which will log it)
      next(error);
    }
  }

  /**
   * Middleware chain for reset password endpoint
   */
  get resetPasswordMiddleware(): RequestHandler[] {
    return [validateRequest(resetPasswordSchema), this.resetPassword.bind(this)];
  }

  /**
   * Handle reset password request
   */
  async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    const logger = createRequestLogger(req.requestId);
    const dto = req.body; // Extract validated body (already validated by middleware)

    try {
      // Log password reset attempt (no sensitive data)
      logger.info({ email: dto.email }, 'Password reset attempt');

      // Get context data for security tracking
      const ipAddress = req.ip ?? req.socket.remoteAddress;
      const userAgent = req.headers['user-agent'];

      const context = {
        ipAddress: ipAddress ?? 'unknown',
        userAgent: userAgent ?? 'unknown',
        logger, // Pass logger to service
      };

      // Call service
      const result = await this.resetPasswordService.resetPassword(dto, context);

      // Log successful reset
      logger.info({ email: dto.email }, 'Password reset completed');

      // Send success response
      res.status(200).json(result);
    } catch (error) {
      // Pass to central error handler middleware (which will log it)
      next(error);
    }
  }
}
