import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { validateBody } from '../middlewares/validate';
import { signupSchema, loginSchema } from '../schemas/auth.schema';
import { authenticate } from '../middlewares/auth';

const router = Router();

router.post('/signup', validateBody(signupSchema), (req, res, next) =>
  authController.signup(req, res, next)
);

router.post('/login', validateBody(loginSchema), (req, res, next) =>
  authController.login(req, res, next)
);

router.get('/me', authenticate, (req, res, next) =>
  authController.getMe(req, res, next)
);

export default router;
