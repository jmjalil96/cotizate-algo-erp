import { PrismaClient } from '@prisma/client';

import { env } from './env.js';
import { logger } from './logger.js';

declare global {
  var prisma: PrismaClient | undefined;
}

const prismaClientSingleton = (): PrismaClient => {
  return new PrismaClient({
    log:
      env.NODE_ENV === 'development'
        ? [
            { level: 'query', emit: 'event' },
            { level: 'error', emit: 'event' },
            { level: 'warn', emit: 'event' },
            { level: 'info', emit: 'event' },
          ]
        : [{ level: 'error', emit: 'event' }],
    errorFormat: env.NODE_ENV === 'development' ? 'pretty' : 'minimal',
  });
};

export const prisma = globalThis.prisma ?? prismaClientSingleton();

if (env.NODE_ENV !== 'production') {
  globalThis.prisma = prisma;
}

// Attach event listeners for logging
interface QueryEvent {
  query: string;
  params: string;
  duration: number;
  target: string;
}

interface LogEvent {
  message: string;
  target: string;
}

prisma.$on('query' as never, (e: QueryEvent) => {
  if (env.NODE_ENV === 'development') {
    logger.debug(
      {
        query: e.query,
        params: e.params,
        duration: e.duration,
        target: e.target,
      },
      'Prisma Query'
    );
  }
});

prisma.$on('error' as never, (e: LogEvent) => {
  logger.error(
    {
      message: e.message,
      target: e.target,
    },
    'Prisma Error'
  );
});

prisma.$on('warn' as never, (e: LogEvent) => {
  logger.warn(
    {
      message: e.message,
      target: e.target,
    },
    'Prisma Warning'
  );
});

prisma.$on('info' as never, (e: LogEvent) => {
  logger.info(
    {
      message: e.message,
      target: e.target,
    },
    'Prisma Info'
  );
});

// Graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

// Export types for use throughout the application
export type { User, UserRole, UserStatus, Prisma } from '@prisma/client';