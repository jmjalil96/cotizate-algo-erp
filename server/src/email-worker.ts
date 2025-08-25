/* eslint-disable unicorn/no-process-exit */
import process from 'node:process';

import { logger } from './config/logger.js';
import { closeQueue } from './email/queue.js';
import { closeTransporter, verifyConnection } from './email/sender.js';
import { startEmailWorker, stopEmailWorker } from './email/worker.js';

let worker: ReturnType<typeof startEmailWorker> | null = null;
let isShuttingDown = false;

const gracefulShutdown = async (signal: string): Promise<void> => {
  if (isShuttingDown) {
    logger.info('Shutdown already in progress...');
    return;
  }
  
  isShuttingDown = true;
  logger.info(`Received ${signal}, starting graceful shutdown...`);
  
  try {
    if (worker) {
      await stopEmailWorker(worker);
    }
    
    await closeTransporter();
    await closeQueue();
    
    logger.info('Email worker shutdown complete');
    process.exit(0);
  } catch (error) {
    logger.error({ error }, 'Error during shutdown');
    process.exit(1);
  }
};

const handleError = (error: Error): void => {
  logger.error({ error }, 'Unhandled error in email worker');
  gracefulShutdown('UNHANDLED_ERROR');
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('uncaughtException', handleError);
process.on('unhandledRejection', (reason) => {
  handleError(new Error(`Unhandled rejection: ${reason}`));
});

const startWorker = async (): Promise<void> => {
  try {
    logger.info('Starting email worker...');
    
    const isConnected = await verifyConnection();
    if (!isConnected) {
      logger.warn('Email service not available, but worker will continue (emails will be queued)');
    }
    
    worker = startEmailWorker();
    
    logger.info('Email worker is running');
    
    setInterval(async () => {
      const connected = await verifyConnection();
      if (!connected) {
        logger.warn('Email service connection lost');
      }
    }, 60000);
    
  } catch (error) {
    logger.error({ error }, 'Failed to start email worker');
    process.exit(1);
  }
};

startWorker();