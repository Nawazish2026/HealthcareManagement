import { Router } from 'express';
import { centreController } from '../controllers/centre.controller';
import { validateBody, validateQuery } from '../middlewares/validate';
import {
  createCentreSchema,
  addTestToCentreSchema,
  listCentresQuerySchema,
} from '../schemas/centre.schema';
import { authenticate, requireRole } from '../middlewares/auth';

const router = Router();

// Public / Authenticated catalogue browsing
router.get('/', validateQuery(listCentresQuerySchema), (req, res, next) =>
  centreController.listCentres(req, res, next)
);

router.get('/:id', (req, res, next) =>
  centreController.getCentreById(req, res, next)
);

// Admin-only management
router.post(
  '/',
  authenticate,
  requireRole('ADMIN'),
  validateBody(createCentreSchema),
  (req, res, next) => centreController.createCentre(req, res, next)
);

router.post(
  '/:id/tests',
  authenticate,
  requireRole('ADMIN'),
  validateBody(addTestToCentreSchema),
  (req, res, next) => centreController.addTestToCentre(req, res, next)
);

export default router;
