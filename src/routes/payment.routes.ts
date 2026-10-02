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
 * Process a simulated payment for a pending booking.
 * Restricted to authenticated users for their own bookings.
 */
router.post(
  '/',
  authenticate,
  validateBody(simulatePaymentSchema),
  (req, res, next) => paymentController.processPayment(req, res, next)
);

/**
 * Payment provider webhook callback endpoint.
 * Ingests asynchronous payment status events with strict idempotency guarantees.
 */
router.post(
  '/webhook',
  validateBody(paymentWebhookSchema),
  (req, res, next) => paymentController.handleWebhook(req, res, next)
);

export default router;
