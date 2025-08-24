import { hostname } from 'node:os';

import pino from 'pino';

import { env } from './env.js';

/**
 * Create Pino logger instance with environment-based configuration
 */
export const logger = pino({
  level: env.NODE_ENV === 'production' ? 'info' : 'debug',
  base: {
    pid: process.pid,
    hostname: hostname(),
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  ...(env.NODE_ENV !== 'production' && {
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:standard',
        ignore: 'pid,hostname',
      },
    },
  }),
});

/**
 * Create a child logger with request context
 */
export function createRequestLogger(requestId: string): pino.Logger {
  return logger.child({ requestId });
}
