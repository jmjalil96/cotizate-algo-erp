import { RequestHandler } from 'express';
import jwt from 'jsonwebtoken';

const { TokenExpiredError, JsonWebTokenError } = jwt;

import { createRequestLogger } from '../../../config/logger.js';
import { InvalidAccessTokenError } from '../domain/session/session.errors.js';
import { AUTH } from '../shared/auth.constants.js';
import { verifyAccessToken } from '../shared/utils/jwt.util.js';

import type { JwtPayload } from '../domain/session/session.dto.js';

// Extend Express Request type to include auth context
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      auth?: JwtPayload; // Full decoded JWT payload
      userId?: string; // Convenience property for quick access
    }
  }
}

/**
 * Middleware to validate access token from httpOnly cookie
 * Attaches decoded JWT payload to request for downstream use
 */
export const validateAccessToken: RequestHandler = (req, _res, next) => {
  const logger = createRequestLogger(req.requestId);

  // Skip validation for OPTIONS requests (CORS preflight)
  if (req.method === 'OPTIONS') {
    return next();
  }

  try {
    // Step 1: Extract access token from cookie
    const token = req.cookies[AUTH.COOKIES.ACCESS_TOKEN_NAME];

    if (!token) {
      logger.warn(
        {
          path: req.path,
          method: req.method,
          ip: req.ip,
        },
        'Access token validation failed - token missing'
      );
      throw new InvalidAccessTokenError();
    }

    // Step 2: Verify token (signature, expiry, issuer, audience)
    let decoded: JwtPayload;
    try {
      decoded = verifyAccessToken(token);
    } catch (jwtError) {
      // Log specific JWT error internally
      if (jwtError instanceof TokenExpiredError) {
        logger.warn(
          {
            path: req.path,
            method: req.method,
            ip: req.ip,
            expiredAt: jwtError.expiredAt,
          },
          'Access token validation failed - token expired'
        );
      } else if (jwtError instanceof JsonWebTokenError) {
        logger.warn(
          {
            path: req.path,
            method: req.method,
            ip: req.ip,
            jwtError: jwtError.message,
          },
          'Access token validation failed - invalid token'
        );
      } else {
        logger.error(
          {
            path: req.path,
            method: req.method,
            ip: req.ip,
            error: jwtError instanceof Error ? jwtError.message : 'Unknown error',
          },
          'Access token validation failed - unexpected error'
        );
      }

      // Always throw generic error to prevent enumeration
      throw new InvalidAccessTokenError();
    }

    // Step 3: Attach decoded payload to request
    req.auth = decoded;
    req.userId = decoded.sub; // Convenience property

    logger.debug(
      {
        userId: decoded.sub,
        email: decoded.email,
        org: decoded.org,
        jti: decoded.jti,
        path: req.path,
        method: req.method,
      },
      'Access token validated successfully'
    );

    // Step 4: Continue to next middleware/handler
    next();
  } catch (error) {
    // Pass known auth errors to error handler
    if (error instanceof InvalidAccessTokenError) {
      return next(error);
    }

    // Log and wrap unexpected errors
    logger.error(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
        path: req.path,
        method: req.method,
      },
      'Unexpected error in access token validation'
    );

    next(new InvalidAccessTokenError());
  }
};

/**
 * Optional: Middleware variant that allows optional authentication
 * Sets req.auth if token is valid, but doesn't fail if missing/invalid
 */
export const optionalAuth: RequestHandler = (req, _res, next) => {
  const logger = createRequestLogger(req.requestId);

  // Skip validation for OPTIONS requests
  if (req.method === 'OPTIONS') {
    return next();
  }

  try {
    const token = req.cookies[AUTH.COOKIES.ACCESS_TOKEN_NAME];

    if (!token) {
      // No token is okay for optional auth
      return next();
    }

    // Try to verify token
    const decoded = verifyAccessToken(token);
    req.auth = decoded;
    req.userId = decoded.sub;

    logger.debug(
      {
        userId: decoded.sub,
        path: req.path,
        method: req.method,
      },
      'Optional auth - token validated'
    );
  } catch {
    // Ignore errors for optional auth
    logger.debug(
      {
        path: req.path,
        method: req.method,
      },
      'Optional auth - invalid token ignored'
    );
  }

  next();
};
