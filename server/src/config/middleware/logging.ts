import { Express, Request, Response, NextFunction, RequestHandler } from 'express';

import { createRequestLogger } from '../logger.js';

/**
 * HTTP request logging middleware
 */
const httpLogger: RequestHandler = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  const requestLogger = createRequestLogger(req.requestId);

  // Log incoming request
  requestLogger.info(
    {
      method: req.method,
      url: req.url,
      userAgent: req.headers['user-agent'],
      ip: req.ip,
    },
    'Incoming request'
  );

  // Log response after it's sent
  res.on('finish', () => {
    const responseTime = Date.now() - startTime;
    requestLogger.info(
      {
        method: req.method,
        url: req.url,
        statusCode: res.statusCode,
        responseTime: `${responseTime}ms`,
      },
      'Request completed'
    );
  });

  next();
};

/**
 * Apply logging middleware to Express app
 */
export function applyLogging(app: Express): void {
  app.use(httpLogger);
}
