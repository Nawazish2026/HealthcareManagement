import app from './app';
import { config } from './config';
import { logger } from './utils/logger';
import prisma from './db/prisma';

const server = app.listen(config.port, () => {
  logger.info(`=======================================================`);
  logger.info(` EVE Healthcare Diagnostic & Payment Service Started! `);
  logger.info(` Environment: ${config.env}`);
  logger.info(` Port:        ${config.port}`);
  logger.info(` API URL:     http://localhost:${config.port}/api/v1`);
  logger.info(` Swagger UI:  http://localhost:${config.port}/api/docs`);
  logger.info(` HealthCheck: http://localhost:${config.port}/health`);
  logger.info(`=======================================================`);
});

// Graceful shutdown handling
const shutdown = async (signal: string) => {
  logger.info(`Received ${signal}. Shutting down gracefully...`);
  server.close(async () => {
    logger.info('HTTP server closed.');
    await prisma.$disconnect();
    logger.info('Database connection closed.');
    process.exit(0);
  });

  // Force close after 10s if dangling connections exist
  setTimeout(() => {
    logger.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
