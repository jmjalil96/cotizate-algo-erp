import { type Job } from 'bullmq';

import { logger } from '../config/logger.js';
import { AppError } from '../shared/errors.js';

import { createEmailWorker, type EmailJobData, type EmailJobResult } from './queue.js';
import { sendEmail } from './sender.js';
import { renderTemplate, initializeTemplates } from './templates.js';

const processEmailJob = async (job: Job<EmailJobData>): Promise<EmailJobResult> => {
  const { to, subject, template, data, from } = job.data;
  const jobLogger = logger.child({ 
    jobId: job.id, 
    jobName: job.name,
    attempt: job.attemptsMade,
    template,
    to,
  });

  jobLogger.info('Processing email job');

  try {
    const html = renderTemplate(template, data);
    
    const plainText = html
      .replace(/<style[^>]*>.*?<\/style>/gs, '')
      .replace(/<script[^>]*>.*?<\/script>/gs, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    const result = await sendEmail({
      to,
      ...(from && { from }),
      subject,
      html,
      text: plainText,
    });

    jobLogger.info({ 
      messageId: result.messageId,
      accepted: result.accepted,
      rejected: result.rejected,
    }, 'Email job completed successfully');

    return result;
  } catch (error) {
    jobLogger.error({ error }, 'Email job failed');
    
    if (error instanceof AppError) {
      throw error;
    }
    
    if (error instanceof Error) {
      throw new AppError(
        500,
        `Email job processing failed: ${error.message}`,
        'EMAIL_JOB_FAILED',
        { 
          jobId: job.id,
          template,
          error: error.message,
        }
      );
    }
    
    throw new AppError(
      500,
      'Email job processing failed',
      'EMAIL_JOB_FAILED',
      { jobId: job.id, template }
    );
  }
};

export const startEmailWorker = (): ReturnType<typeof createEmailWorker> => {
  initializeTemplates();
  
  const worker = createEmailWorker(processEmailJob);
  
  worker.on('completed', (job) => {
    logger.debug({ 
      jobId: job.id,
      jobName: job.name,
      returnValue: job.returnvalue,
    }, 'Job completed');
  });
  
  worker.on('failed', (job, error) => {
    logger.error({ 
      jobId: job?.id,
      jobName: job?.name,
      error: error.message,
      stack: error.stack,
    }, 'Job failed');
  });
  
  worker.on('error', (error) => {
    logger.error({ error }, 'Worker error');
  });
  
  logger.info('Email worker started');
  
  return worker;
};

export const stopEmailWorker = async (worker: ReturnType<typeof createEmailWorker>): Promise<void> => {
  logger.info('Stopping email worker...');
  await worker.close();
  logger.info('Email worker stopped');
};