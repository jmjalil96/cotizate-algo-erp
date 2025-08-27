import { Request, Response, NextFunction, RequestHandler } from 'express';

import { createRequestLogger } from '../../../../config/logger.js';
import { validateRequest } from '../../../../config/middleware/request.js';
import { setAuthCookies, clearAuthCookies, extractRefreshToken } from '../../shared/utils/cookie.util.js';
import { generateDeviceFingerprint, parseDeviceName } from '../../shared/utils/device.util.js';

import { LoginService } from './login.service.js';
import { RefreshService } from './refresh.service.js';
import { OtpRequiredError } from './session.errors.js';
import { loginSchema, refreshSchema } from './session.validator.js';

import type { SessionContext, RefreshContext } from './session.dto.js';

export class SessionController {
  constructor(
    private readonly loginService: LoginService,
    private readonly refreshService: RefreshService
  ) {}

  /**
   * Middleware chain for login endpoint
   */
  get loginMiddleware(): RequestHandler[] {
    return [validateRequest(loginSchema), this.login.bind(this)];
  }

  /**
   * Handle login request
   */
  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    const logger = createRequestLogger(req.requestId);
    const dto = req.body; // Extract validated body (already validated by middleware)

    try {
      // Log login attempt (no password)
      logger.info({ email: dto.email, hasOtp: !!dto.otp }, 'Login attempt');

      // Build session context
      const ipAddress = req.ip ?? req.socket.remoteAddress ?? 'unknown';
      const userAgent = req.headers['user-agent'] ?? 'unknown';
      const deviceFingerprint = generateDeviceFingerprint(req);
      const deviceName = dto.deviceName ?? parseDeviceName(userAgent);

      const context: SessionContext = {
        ipAddress,
        userAgent,
        deviceFingerprint,
        deviceName,
        logger,
      };

      // Call service
      const { response, tokens } = await this.loginService.login(dto, context);

      // Set auth cookies if tokens are provided (successful login)
      if (tokens) {
        setAuthCookies(res, tokens);

        logger.info(
          {
            userId: response.data?.userId,
            email: response.data?.email,
            organizationId: response.data?.organizationId,
          },
          'Login successful, cookies set'
        );
      }

      // Send success response
      res.status(200).json(response);
    } catch (error) {
      // Special handling for OTP required (not really an error)
      if (error instanceof OtpRequiredError) {
        logger.info({ email: dto.email }, 'Login requires OTP verification');

        res.status(200).json({
          success: false,
          message: error.message,
          requiresOtp: true,
        });
        return;
      }

      // Pass other errors to central error handler
      next(error);
    }
  }

  /**
   * Middleware chain for refresh endpoint
   */
  get refreshMiddleware(): RequestHandler[] {
    return [
      validateRequest(refreshSchema), // Validates body is empty
      this.refresh.bind(this),
    ];
  }

  /**
   * Handle refresh request
   */
  async refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
    const logger = createRequestLogger(req.requestId);

    try {
      // Extract refresh token from cookie
      const refreshToken = extractRefreshToken(req);

      logger.info({ hasToken: !!refreshToken }, 'Refresh attempt');

      // Build refresh context
      const ipAddress = req.ip ?? req.socket.remoteAddress ?? 'unknown';
      const userAgent = req.headers['user-agent'] ?? 'unknown';
      const deviceFingerprint = generateDeviceFingerprint(req);

      const context: RefreshContext = {
        ipAddress,
        userAgent,
        deviceFingerprint,
        logger,
      };

      // Call service
      const { response, tokens } = await this.refreshService.refresh(refreshToken, context);

      // Set new auth cookies if tokens are provided
      if (tokens) {
        setAuthCookies(res, tokens);

        logger.info(
          {
            userId: response.data?.userId,
            email: response.data?.email,
            organizationId: response.data?.organizationId,
          },
          'Token refresh successful, cookies updated'
        );
      }

      // Send success response
      res.status(200).json(response);
    } catch (error) {
      // Clear cookies on any refresh failure (security best practice)
      clearAuthCookies(res);

      logger.debug('Refresh failed, cookies cleared');

      // Pass to central error handler
      next(error);
    }
  }
}
