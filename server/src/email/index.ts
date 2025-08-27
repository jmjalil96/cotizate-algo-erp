import { z } from 'zod';

import { logger } from '../config/logger.js';
import { AppError } from '../shared/errors.js';

import { emailQueue, type EmailJobData } from './queue.js';

import type { Job, JobsOptions } from 'bullmq';

const emailSchema = z.object({
  to: z.union([z.string().email(), z.array(z.string().email()).min(1)]),
  subject: z.string().min(1, 'Subject is required').max(200),
  template: z.string().min(1, 'Template is required'),
  data: z.record(z.string(), z.unknown()).default({}),
  from: z.string().email().optional(),
});

export type QueueEmailOptions = z.infer<typeof emailSchema> & {
  priority?: number;
  delay?: number;
  jobId?: string;
};

export const queueEmail = async (options: QueueEmailOptions): Promise<string> => {
  try {
    const validated = emailSchema.parse(options);

    const jobOptions: JobsOptions = {};
    if (options.priority !== undefined) jobOptions.priority = options.priority;
    if (options.delay !== undefined) jobOptions.delay = options.delay;

    const job = await emailQueue.add('send-email', validated as EmailJobData, {
      ...jobOptions,
      ...(options.jobId && { jobId: options.jobId }),
    });

    logger.info(
      {
        jobId: job.id,
        template: validated.template,
        to: validated.to,
        subject: validated.subject,
      },
      'Email queued successfully'
    );

    return job.id ?? 'unknown';
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new AppError(
        400,
        'Invalid email data',
        'EMAIL_VALIDATION_FAILED',
        error.issues.map((e) => ({
          path: e.path.join('.'),
          message: e.message,
        }))
      );
    }

    logger.error({ error, options }, 'Failed to queue email');

    throw new AppError(500, 'Failed to queue email', 'EMAIL_QUEUE_FAILED', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

export const getEmailJob = async (jobId: string): Promise<Job<EmailJobData> | undefined> => {
  try {
    return await emailQueue.getJob(jobId);
  } catch (error) {
    logger.error({ error, jobId }, 'Failed to get email job');
    return undefined;
  }
};

export const getEmailJobStatus = async (jobId: string): Promise<string | undefined> => {
  try {
    const job = await emailQueue.getJob(jobId);
    if (!job) return undefined;

    const state = await job.getState();
    return state;
  } catch (error) {
    logger.error({ error, jobId }, 'Failed to get email job status');
    return undefined;
  }
};

export const retryEmailJob = async (jobId: string): Promise<boolean> => {
  try {
    const job = await emailQueue.getJob(jobId);
    if (!job) return false;

    await job.retry();
    logger.info({ jobId }, 'Email job retried');
    return true;
  } catch (error) {
    logger.error({ error, jobId }, 'Failed to retry email job');
    return false;
  }
};

export const removeEmailJob = async (jobId: string): Promise<boolean> => {
  try {
    const job = await emailQueue.getJob(jobId);
    if (!job) return false;

    await job.remove();
    logger.info({ jobId }, 'Email job removed');
    return true;
  } catch (error) {
    logger.error({ error, jobId }, 'Failed to remove email job');
    return false;
  }
};

export const getQueueStats = async (): Promise<{
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
  total: number;
} | null> => {
  try {
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      emailQueue.getWaitingCount(),
      emailQueue.getActiveCount(),
      emailQueue.getCompletedCount(),
      emailQueue.getFailedCount(),
      emailQueue.getDelayedCount(),
    ]);

    return {
      waiting,
      active,
      completed,
      failed,
      delayed,
      total: waiting + active + completed + failed + delayed,
    };
  } catch (error) {
    logger.error({ error }, 'Failed to get queue stats');
    return null;
  }
};

export { verifyConnection } from './sender.js';
export { initializeTemplates, clearTemplateCache } from './templates.js';
