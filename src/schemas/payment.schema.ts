import { z } from 'zod';

export const simulatePaymentSchema = z.object({
  bookingId: z.string().uuid('Valid booking UUID is required'),
  paymentMethod: z.enum(['CARD', 'UPI', 'NET_BANKING', 'SIMULATED']).optional().default('SIMULATED'),
  simulateStatus: z.enum(['SUCCESS', 'FAILED']).optional(), // Allows testing both paths reliably
});

export const paymentWebhookSchema = z.object({
  eventId: z.string().min(1, 'Unique eventId is required for idempotency tracking'),
  eventType: z.enum(['payment.succeeded', 'payment.failed']),
  bookingId: z.string().uuid('Valid booking UUID is required'),
  transactionId: z.string().min(1, 'Transaction ID is required'),
  amount: z.number().positive('Payment amount must be positive'),
  signature: z.string().optional(),
  timestamp: z.union([z.string(), z.number()]).optional(),
});

export type SimulatePaymentInput = z.infer<typeof simulatePaymentSchema>;
export type PaymentWebhookInput = z.infer<typeof paymentWebhookSchema>;
