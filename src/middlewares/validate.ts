import { Request, Response, NextFunction } from 'express';
import { ZodType } from 'zod';

export const validateBody = (schema: ZodType<any>) => {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      req.body = await schema.parseAsync(req.body);
      next();
    } catch (error) {
      next(error);
    }
  };
};

export const validateQuery = (schema: ZodType<any>) => {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = await schema.parseAsync(req.query);
      // Express 5 makes req.query a getter on Request prototype; mutate or attach safely
      if (req.query && typeof req.query === 'object') {
        Object.keys(req.query).forEach((k) => delete (req.query as any)[k]);
        Object.assign(req.query, parsed);
      }
      (req as any).validatedQuery = parsed;
      next();
    } catch (error) {
      next(error);
    }
  };
};

export const validateParams = (schema: ZodType<any>) => {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = await schema.parseAsync(req.params);
      (req as any).validatedParams = parsed;
      next();
    } catch (error) {
      next(error);
    }
  };
};
