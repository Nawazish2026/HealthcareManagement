import { Router } from 'express';
import { paymentController } from '../controllers/payment.controller';
import { validateBody } from '../middlewares/validate';
import {
  simulatePaymentSchema,
  paymentWebhookSchema,
} from '../schemas/payment.schema';
import { authenticate } from '../middlewares/auth';

const router = Router();

/**
 * Requirement 4: Simulated Payment Service
 * POST /payments/ (or /api/v1/payments/)
 * Authenticated user simulates a payment for their booking.
 */
router.post(
  '/',
  authenticate,
  validateBody(simulatePaymentSchema),
  (req, res, next) => paymentController.processPayment(req, res, next)
);

/**
 * Requirement 5: Payment Webhook
 * POST /payments/webhook/ (or /api/v1/payments/webhook/)
 * Accepts payment status updates from external payment provider.
 * Must be strictly idempotent and safe against repeated events.
 */
router.post(
  '/webhook',
  validateBody(paymentWebhookSchema),
  (req, res, next) => paymentController.handleWebhook(req, res, next)
);

export default router;
