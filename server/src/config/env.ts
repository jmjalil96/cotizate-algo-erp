import dotenv from 'dotenv';
import pino from 'pino';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().positive().default(3000),
  API_PREFIX: z.string().default('/api/v1'),
  CORS_ORIGIN: z
    .string()
    .refine(
      (val) => {
        if (val === '*') return true;
        const origins = val.split(',').map((o) => o.trim());
        return origins.every((origin) => {
          try {
            new URL(origin);
            return true;
          } catch {
            return false;
          }
        });
      },
      { message: 'Must be "*" or comma-separated valid URLs' }
    )
    .default('http://localhost:3000'),
});

const parseEnv = (): z.infer<typeof envSchema> => {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    // Use basic pino logger for env validation errors (logger.ts needs env)
    const tempLogger = pino();
    tempLogger.error(
      {
        errors: parsed.error.flatten().fieldErrors,
      },
      '❌ Invalid environment variables'
    );
    // eslint-disable-next-line unicorn/no-process-exit
    process.exit(1);
  }

  return parsed.data;
};

export const env = parseEnv();

export type Env = z.infer<typeof envSchema>;
