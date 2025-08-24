import app from './app.js';
import { env } from './config/env.js';
import { logger } from './config/logger.js';

const port = env.PORT;

process.on('unhandledRejection', (reason) => {
  logger.error({ reason }, 'Unhandled promise rejection');
});

process.on('uncaughtException', (error) => {
  logger.error({ error }, 'Uncaught exception');

  process.exit(1);
});

app.listen(port, () => {
  logger.info(
    {
      port,
      environment: env.NODE_ENV,
      apiPrefix: env.API_PREFIX,
    },
    '🚀 Server started successfully'
  );
});
