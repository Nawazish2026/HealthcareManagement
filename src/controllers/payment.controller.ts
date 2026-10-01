import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { paymentService } from '../services/payment.service';
import { webhookService } from '../services/webhook.service';

export class PaymentController {
  async processPayment(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await paymentService.processSimulatedPayment(req.user!, req.body);
      res.status(200).json({
        success: true,
        message: `Payment ${result.payment.status.toLowerCase()} and booking updated to ${result.booking.status}`,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async handleWebhook(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await webhookService.processPaymentWebhook(req.body);
      res.status(200).json({
        success: true,
        message: result.status === 'already_processed'
          ? 'Duplicate webhook event received; safely ignored without duplicate state change.'
          : 'Webhook processed successfully and booking state reconciled.',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const paymentController = new PaymentController();
