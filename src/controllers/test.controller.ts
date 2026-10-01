import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { centreService } from '../services/centre.service';

export class TestController {
  async listTests(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const tests = await centreService.listTests(req.query as any);
      res.status(200).json({
        success: true,
        count: tests.length,
        data: tests,
      });
    } catch (error) {
      next(error);
    }
  }

  async createTest(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const test = await centreService.createTest(req.body);
      res.status(201).json({
        success: true,
        message: 'Diagnostic test created successfully',
        data: test,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const testController = new TestController();
