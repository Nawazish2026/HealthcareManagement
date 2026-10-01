import { Router } from 'express';
import { testController } from '../controllers/test.controller';
import { validateBody, validateQuery } from '../middlewares/validate';
import { createTestSchema, listTestsQuerySchema } from '../schemas/test.schema';
import { authenticate, requireRole } from '../middlewares/auth';

const router = Router();

router.get('/', validateQuery(listTestsQuerySchema), (req, res, next) =>
  testController.listTests(req, res, next)
);

router.post(
  '/',
  authenticate,
  requireRole('ADMIN'),
  validateBody(createTestSchema),
  (req, res, next) => testController.createTest(req, res, next)
);

export default router;
