import { Response, NextFunction } from 'express';
import crypto from 'crypto';
import { AuthenticatedRequest } from '../types';
import { logger } from '../utils/logger';

export const requestIdMiddleware = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  const reqId = (req.headers['x-request-id'] as string) || crypto.randomUUID();
  req.requestId = reqId;
  res.setHeader('X-Request-ID', reqId);

  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info(
      `[${reqId}] ${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`
    );
  });

  next();
};
