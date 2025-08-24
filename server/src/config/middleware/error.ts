import { AppError, isAppError } from '../../shared/errors.js';
import { env } from '../env.js';
import { createRequestLogger } from '../logger.js';

import type { ErrorRequestHandler, RequestHandler } from 'express';

export const notFoundHandler: RequestHandler = (req, _res, next) => {
  next(new AppError(404, 'Not found', 'NOT_FOUND', { method: req.method, url: req.originalUrl }));
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const errorHandler: ErrorRequestHandler = (err: any, req, res, _next) => {
  const requestLogger = createRequestLogger(req.requestId);

  // Defaults
  let status = 500;
  let code = 'INTERNAL_SERVER_ERROR';
  let message = 'Internal server error';
  let details: unknown;

  if (isAppError(err)) {
    status = err.statusCode;
    code = err.code;
    message = err.message;
    details = err.details;
  } else if (err instanceof SyntaxError && 'body' in err) {
    status = 400;
    code = 'BAD_JSON';
    message = 'Invalid JSON';
  } else if (err?.type === 'entity.too.large' || err?.statusCode === 413) {
    status = 413;
    code = 'PAYLOAD_TOO_LARGE';
    message = 'Payload too large';
  } else if (err?.message === 'Not allowed by CORS') {
    status = 403;
    code = 'CORS_NOT_ALLOWED';
    message = 'Not allowed by CORS';
  } else if (err?.status || err?.statusCode) {
    status = err.status ?? err.statusCode ?? 500;
    message = err.message ?? message;
  }

  // Zod-like shape (best-effort) for details if present
  if (!details && err?.issues) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    details = err.issues.map((i: any) => ({
      path: Array.isArray(i.path) ? i.path.join('.') : i.path,
      message: i.message,
    }));
    if (status === 500) {
      status = 400;
      code = 'VALIDATION_ERROR';
      message = 'Validation failed';
    }
  }

  if (status >= 500) {
    requestLogger.error({ err, status, code }, 'Unhandled error');
  } else {
    requestLogger.warn({ err, status, code }, 'Handled error');
  }

  const payload: Record<string, unknown> = {
    error: code,
    message: status >= 500 && env.NODE_ENV === 'production' ? 'Internal server error' : message,
    requestId: req.requestId,
  };
  if (details) payload['details'] = details;
  if (env.NODE_ENV !== 'production' && status >= 500 && err?.stack) {
    payload['stack'] = err.stack;
  }

  res.status(status).json(payload);
};
