import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../errors/AppError';
import { logger } from '../utils/logger';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // Handle Custom App Errors
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
      },
    });
    return;
  }

  // Handle Zod Validation Errors
  if (err instanceof ZodError) {
    const rawIssues = (err as any).issues || (err as any).errors || [];
    const formattedErrors = rawIssues.map((e: any) => ({
      path: Array.isArray(e.path) ? e.path.join('.') : String(e.path),
      message: e.message,
    }));

    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid request payload or query parameters',
        details: formattedErrors,
      },
    });
    return;
  }

  // Handle Prisma unique constraint violations (P2002)
  if ((err as any).code === 'P2002') {
    const target = (err as any).meta?.target;
    res.status(409).json({
      success: false,
      error: {
        code: 'DUPLICATE_RESOURCE',
        message: `A record with this ${target ? target : 'field'} already exists.`,
      },
    });
    return;
  }

  // Handle Prisma record not found (P2025)
  if ((err as any).code === 'P2025') {
    res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'The requested record was not found in the database.',
      },
    });
    return;
  }

  // Log unhandled server errors
  logger.error(`[UnhandledError] ${req.method} ${req.originalUrl}: ${err.message}`, err);

  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: process.env.NODE_ENV === 'production' 
        ? 'An unexpected error occurred. Please contact support.' 
        : err.message,
    },
  });
};
