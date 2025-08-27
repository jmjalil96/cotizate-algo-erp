import express, { Express, Request, Response } from 'express';

import { env } from './config/env.js';
import { errorHandler, notFoundHandler } from './config/middleware/error.js';
import { applyLogging } from './config/middleware/logging.js';
import { applyRequestMiddleware } from './config/middleware/request.js';
import { applySecurity } from './config/middleware/security.js';
import authRoutes from './features/auth/routes/auth.routes.js';

const app: Express = express();

// If deploying behind a proxy (e.g. Render, Railway, Heroku)
app.set('trust proxy', 1);

// Apply security middleware
applySecurity(app);

// Apply request handling middleware (includes request ID)
applyRequestMiddleware(app);

// Apply logging middleware (needs request ID from request middleware)
applyLogging(app);

// Health endpoint (under API prefix, rate-limit skipped in security middleware)
app.get(`${env.API_PREFIX}/healthz`, (_req: Request, res: Response) => {
  res.json({ ok: true });
});

// Auth routes
app.use(`${env.API_PREFIX}/auth`, authRoutes);

app.get('/', (_req: Request, res: Response) => {
  res.json({ message: 'Server is running!' });
});

// 404 handler for unmatched routes
app.use(notFoundHandler);

// Central error handler (must be last)
app.use(errorHandler);

export default app;
