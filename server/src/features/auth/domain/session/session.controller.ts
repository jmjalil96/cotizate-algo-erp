import { Request, Response, NextFunction, RequestHandler } from 'express';

import { createRequestLogger } from '../../../../config/logger.js';
import { validateRequest } from '../../../../config/middleware/request.js';
import { validateAccessToken } from '../../middleware/validate-access-token.middleware.js';
import {
  setAuthCookies,
  clearAuthCookies,
  extractRefreshToken,
} from '../../shared/utils/cookie.util.js';
import { extractDeviceContext, parseDeviceName } from '../../shared/utils/device.util.js';

import { LoginService } from './login.service.js';
import { LogoutService } from './logout.service.js';
import { MeService } from './me.service.js';
import { RefreshService } from './refresh.service.js';
import { OtpRequiredError } from './session.errors.js';
import { loginSchema, refreshSchema, logoutSchema } from './session.validator.js';

import type { SessionContext, RefreshContext, LogoutContext, MeContext } from './session.dto.js';

export class SessionController {
  constructor(
    private readonly loginService: LoginService,
    private readonly refreshService: RefreshService,
    private readonly logoutService: LogoutService,
    private readonly meService: MeService
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
      const { ipAddress, userAgent, deviceFingerprint } = extractDeviceContext(req);
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
      const { ipAddress, userAgent, deviceFingerprint } = extractDeviceContext(req);

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

  /**
   * Middleware chain for logout endpoint
   */
  get logoutMiddleware(): RequestHandler[] {
    return [validateRequest(logoutSchema), this.logout.bind(this)];
  }

  /**
   * Handle logout request
   */
  async logout(req: Request, res: Response, _next: NextFunction): Promise<void> {
    const logger = createRequestLogger(req.requestId);
    const dto = req.body; // Validated body

    // Note: No try-catch needed - logout never throws

    // Extract refresh token from cookie
    const refreshToken = extractRefreshToken(req);

    logger.info({ hasToken: !!refreshToken, everywhere: dto.everywhere }, 'Logout attempt');

    // Build logout context
    const { ipAddress, userAgent, deviceFingerprint } = extractDeviceContext(req);

    const context: LogoutContext = {
      ipAddress,
      userAgent,
      deviceFingerprint,
      everywhere: dto.everywhere ?? false,
      logger,
    };

    // Call service (never throws)
    const response = await this.logoutService.logout(refreshToken, dto, context);

    // Clear auth cookies (always)
    clearAuthCookies(res);

    logger.info(
      {
        sessionsRevoked: response.data?.sessionsRevoked,
        everywhere: dto.everywhere,
      },
      'Logout successful, cookies cleared'
    );

    // Send success response
    res.status(200).json(response);
  }

  /**
   * Middleware chain for me endpoint
   */
  get meMiddleware(): RequestHandler[] {
    return [validateAccessToken, this.me.bind(this)];
  }

  /**
   * Handle me request
   */
  async me(req: Request, res: Response, next: NextFunction): Promise<void> {
    const logger = createRequestLogger(req.requestId);

    try {
      // Log me request
      logger.info({ userId: req.userId }, '/me request');

      // Build context from validated JWT
      const { ipAddress, userAgent, deviceFingerprint } = extractDeviceContext(req);

      // These are guaranteed to be set by validateAccessToken middleware
      // But TypeScript doesn't know that, so we need to check
      if (!req.userId || !req.auth) {
        throw new Error('Authentication middleware did not set user context');
      }

      const context: MeContext = {
        userId: req.userId,
        jwtPayload: req.auth,
        ipAddress,
        userAgent,
        deviceFingerprint,
        logger,
      };

      // Call service
      const response = await this.meService.me(context);

      // Send success response
      res.status(200).json(response);
    } catch (error) {
      // Pass to central error handler
      next(error);
    }
  }
}
