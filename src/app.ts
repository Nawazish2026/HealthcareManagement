import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import apiRouter from './routes';
import paymentRoutes from './routes/payment.routes';
import { errorHandler } from './middlewares/errorHandler';
import { requestIdMiddleware } from './middlewares/requestId';
import { swaggerDocument } from './docs/swagger';
import { NotFoundError } from './errors/AppError';

export const createApp = (): Application => {
  const app = express();

  // Basic security and parsing middlewares
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Global Rate Limiter (Skipped during unit testing)
  if (process.env.NODE_ENV !== 'test') {
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 200, // Limit each IP to 200 requests per windowMs
      standardHeaders: true,
      legacyHeaders: false,
      message: {
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many requests from this IP, please try again after 15 minutes.',
        },
      },
    });
    app.use(limiter);
  }

  // Request-ID tracing and latency tracking
  app.use(requestIdMiddleware);

  // HTTP Request Logger
  if (process.env.NODE_ENV !== 'test') {
    app.use(morgan(':method :url :status :res[content-length] - :response-time ms'));
  }

  // Health check endpoint
  app.get('/health', (_req: Request, res: Response) => {
    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'EVE Healthcare Diagnostic & Payment Backend',
      version: '1.0.0',
    });
  });

  // Interactive Swagger/OpenAPI Documentation
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
  app.get('/api/docs.json', (_req: Request, res: Response) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerDocument);
  });

  // Mount API Version 1
  app.use('/api/v1', apiRouter);

  // Also mount /payments at root so both /payments/... and /api/v1/payments/... work seamlessly
  app.use('/payments', paymentRoutes);

  // Catch-all 404 handler
  app.use((req: Request, _res: Response, next: NextFunction) => {
    next(new NotFoundError(`Endpoint '${req.method} ${req.originalUrl}' not found on this server.`));
  });

  // Global Error Handler
  app.use(errorHandler);

  return app;
};

export default createApp();
