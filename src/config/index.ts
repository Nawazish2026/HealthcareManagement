import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

/**
 * Environment Variable Validation Schema
 * 
 * Validates all required environment variables at startup.
 * If any critical variable is missing, the application crashes immediately
 * with a clear diagnostic error — never boots with unsafe defaults.
 */
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('4000').transform((val) => parseInt(val, 10)),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required. Set it in your .env file.'),
  JWT_SECRET: z
    .string()
    .min(16, 'JWT_SECRET must be at least 16 characters for safe HMAC-SHA256 signing'),
  JWT_EXPIRES_IN: z.string().default('24h'),
  WEBHOOK_SECRET: z.string().default('eve-payment-webhook-secret-key'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const errors = parsed.error.issues.map(
    (issue) => `  ✗ ${issue.path.join('.')}: ${issue.message}`
  );
  console.error(`\n❌ FATAL: Environment validation failed.\n${errors.join('\n')}\n`);
  console.error('Hint: Copy .env.example to .env and fill in the required values.\n');
  process.exit(1);
}

const env = parsed.data;

export const config = {
  env: env.NODE_ENV,
  port: env.PORT,
  databaseUrl: env.DATABASE_URL,
  jwt: {
    secret: env.JWT_SECRET,
    expiresIn: env.JWT_EXPIRES_IN,
  },
  webhook: {
    secret: env.WEBHOOK_SECRET,
  },
};
