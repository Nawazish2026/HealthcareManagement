import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { centreService } from '../services/centre.service';

export class CentreController {
  async listCentres(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const query = (req as any).validatedQuery || req.query;
      const { centres, pagination } = await centreService.listCentres(query);
      res.status(200).json({
        success: true,
        count: centres.length,
        pagination,
        data: centres,
      });
    } catch (error) {
      next(error);
    }
  }

  async getCentreById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const centre = await centreService.getCentreById(id);
      res.status(200).json({
        success: true,
        data: centre,
      });
    } catch (error) {
      next(error);
    }
  }

  async createCentre(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const centre = await centreService.createCentre(req.body);
      res.status(201).json({
        success: true,
        message: 'Diagnostic centre created successfully',
        data: centre,
      });
    } catch (error) {
      next(error);
    }
  }

  async addTestToCentre(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const result = await centreService.addTestToCentre(id, req.body);
      res.status(200).json({
        success: true,
        message: 'Test offering updated for centre successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const centreController = new CentreController();
