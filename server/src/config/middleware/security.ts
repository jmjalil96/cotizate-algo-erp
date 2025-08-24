import cors from 'cors';
import { Express } from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';

import { AppError } from '../../shared/errors.js';
import { env } from '../env.js';

// Cache parsed origins once
const allowedOrigins =
  env.CORS_ORIGIN === '*' ? null : env.CORS_ORIGIN.split(',').map((o) => o.trim());

// CORS configuration
const corsOptions: cors.CorsOptions = {
  origin: (origin, cb) => {
    // Allow non-browser or same-origin requests
    if (!origin) return cb(null, true);

    // Wildcard: allow all
    if (!allowedOrigins) return cb(null, true);

    if (allowedOrigins.includes(origin)) {
      return cb(null, true);
    }

    return cb(new Error('Not allowed by CORS'), false);
  },
  // '*' cannot be used with credentials
  credentials: !!allowedOrigins,
  optionsSuccessStatus: 200,
};

// Rate limiter configuration
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests from this IP, please try again later.',
  handler: (_req, _res, next, options) => {
    next(
      new AppError(
        options.statusCode ?? 429,
        String(options.message ?? 'Too many requests'),
        'RATE_LIMITED'
      )
    );
  },
});

/**
 * Apply security middleware to Express app
 */
export function applySecurity(app: Express): void {
  // Security headers
  app.use(helmet());

  // CORS
  app.use(cors(corsOptions));

  // Rate limiting on API routes, skip health endpoint
  app.use(env.API_PREFIX, (req, res, next) => {
    if (req.path === '/healthz') return next();
    return limiter(req, res, next);
  });
}
