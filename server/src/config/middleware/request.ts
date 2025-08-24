import { randomUUID } from 'node:crypto';

import express, {
  Express,
  Request,
  Response,
  NextFunction,
  RequestHandler,
  ErrorRequestHandler,
} from 'express';
import xss from 'xss';
import { ZodError, ZodSchema } from 'zod';

import { AppError } from '../../shared/errors.js';

// Extend Express Request type to include requestId
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      requestId: string;
    }
  }
}

/**
 * Middleware to attach request ID for tracking
 */
const attachRequestId: RequestHandler = (req, res, next) => {
  // Use client-provided ID if available (for distributed tracing), otherwise generate new one
  const requestId = (req.headers['x-request-id'] as string) || randomUUID();
  req.requestId = requestId;
  res.setHeader('X-Request-Id', requestId);
  next();
};

/**
 * Sanitize string values to prevent XSS attacks
 */
function sanitizeValue(value: unknown): unknown {
  if (typeof value === 'string') {
    // Remove XSS attempts and trim whitespace
    return xss(value.trim()).replace(/\0/g, ''); // Also strip null bytes
  }
  if (Array.isArray(value)) {
    return value.map(sanitizeValue);
  }
  if (value && typeof value === 'object') {
    const sanitized: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value)) {
      sanitized[key] = sanitizeValue(val);
    }
    return sanitized;
  }
  return value;
}

/**
 * Middleware to sanitize request data
 */
const sanitizeRequest: RequestHandler = (req, _res, next) => {
  // Sanitize body (body is mutable)
  if (req.body) {
    req.body = sanitizeValue(req.body);
  }

  // Note: req.query and req.params are read-only in Express 5
  // They are already parsed and sanitized by Express
  // If needed, we could create sanitized copies in req.body or custom properties

  next();
};

/**
 * Custom error handler for JSON parsing errors
 */
const handleJsonError: ErrorRequestHandler = (error, _req, _res, next) => {
  if (error instanceof SyntaxError && 'body' in error) {
    return next(new AppError(400, 'Invalid JSON', 'BAD_JSON'));
  }
  next(error);
};

/**
 * Validation middleware factory
 */
export function validateRequest<T extends ZodSchema>(schema: T) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const validated = schema.parse(req.body);
      req.body = validated;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return next(
          new AppError(
            400,
            'Validation failed',
            'VALIDATION_ERROR',
            error.issues.map((err) => ({
              path: err.path.join('.'),
              message: err.message,
            }))
          )
        );
      }
      next(error);
    }
  };
}

/**
 * Validate query parameters
 */
export function validateQuery<T extends ZodSchema>(schema: T) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const validated = schema.parse(req.query);
      req.query = validated as typeof req.query;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return next(
          new AppError(
            400,
            'Invalid query parameters',
            'VALIDATION_ERROR',
            error.issues.map((err) => ({
              path: err.path.join('.'),
              message: err.message,
            }))
          )
        );
      }
      next(error);
    }
  };
}

/**
 * Validate URL parameters
 */
export function validateParams<T extends ZodSchema>(schema: T) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const validated = schema.parse(req.params);
      req.params = validated as typeof req.params;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return next(
          new AppError(
            400,
            'Invalid URL parameters',
            'VALIDATION_ERROR',
            error.issues.map((err) => ({
              path: err.path.join('.'),
              message: err.message,
            }))
          )
        );
      }
      next(error);
    }
  };
}

/**
 * Apply request handling middleware to Express app
 */
export function applyRequestMiddleware(app: Express): void {
  // Attach request ID for tracking
  app.use(attachRequestId);

  // Parse JSON with size limit
  app.use(
    express.json({
      limit: '10mb',
      strict: true,
    })
  );

  // Parse URL-encoded data with size limit
  app.use(
    express.urlencoded({
      extended: true,
      limit: '10mb',
    })
  );

  // Apply sanitization to all requests
  app.use(sanitizeRequest);

  // Handle JSON parsing errors
  app.use(handleJsonError);
}
