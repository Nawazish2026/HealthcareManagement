import dotenv from 'dotenv';

dotenv.config();

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '4000', 10),
  databaseUrl: process.env.DATABASE_URL || 'file:./eve_healthcare.db',
  jwt: {
    secret: process.env.JWT_SECRET || 'eve-healthcare-jwt-secret-key-super-secure',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  },
  webhook: {
    secret: process.env.WEBHOOK_SECRET || 'eve-payment-webhook-secret-key',
  },
};
