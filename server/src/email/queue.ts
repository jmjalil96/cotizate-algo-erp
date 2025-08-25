import { Queue, Worker, type QueueOptions, type ConnectionOptions } from 'bullmq';

import { env } from '../config/env.js';
import { logger } from '../config/logger.js';

export interface EmailJobData {
  to: string | string[];
  subject: string;
  template: string;
  data: Record<string, unknown>;
  from?: string;
}

export interface EmailJobResult {
  messageId: string;
  accepted: string[];
  rejected: string[];
}

const redisConnection: ConnectionOptions = {
  host: env.REDIS_HOST,
  port: env.REDIS_PORT,
  ...(env.REDIS_PASSWORD && { password: env.REDIS_PASSWORD }),
  db: env.REDIS_DB,
};

const queueOptions: QueueOptions = {
  connection: redisConnection,
  defaultJobOptions: {
    removeOnComplete: {
      count: 100,
      age: 24 * 3600, // 24 hours
    },
    removeOnFail: {
      count: 500,
      age: 7 * 24 * 3600, // 7 days
    },
    attempts: env.QUEUE_MAX_RETRIES,
    backoff: {
      type: 'exponential',
      delay: env.QUEUE_RETRY_DELAY,
    },
  },
};

export const emailQueue = new Queue<EmailJobData, EmailJobResult>('email-queue', queueOptions);

export const createEmailWorker = (processor: Worker<EmailJobData, EmailJobResult>['processFn']): Worker<EmailJobData, EmailJobResult> => {
  return new Worker<EmailJobData, EmailJobResult>('email-queue', processor, {
    connection: redisConnection,
    concurrency: env.QUEUE_CONCURRENCY,
    autorun: true,
  });
};

emailQueue.on('error', (error) => {
  logger.error({ error }, 'Email queue error');
});

export const closeQueue = async (): Promise<void> => {
  await emailQueue.close();
};