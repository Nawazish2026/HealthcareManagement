import prisma from '../db/prisma';
import { PaymentWebhookInput } from '../schemas/payment.schema';
import { NotFoundError, BadRequestError, ConflictError } from '../errors/AppError';
import { logger } from '../utils/logger';

export class WebhookService {
  async processPaymentWebhook(input: PaymentWebhookInput) {
    logger.info(`Received payment webhook event: ${input.eventId} [${input.eventType}]`);

    // Deduplication check: return cached status for previously processed events
    const existingEvent = await prisma.webhookEvent.findUnique({
      where: { eventId: input.eventId },
    });

    if (existingEvent) {
      logger.warn(
        `[IDEMPOTENCY] Duplicate webhook event '${input.eventId}' detected. Status: ${existingEvent.status}. Safely ignoring duplicate.`
      );
      return {
        status: 'already_processed',
        message: 'Duplicate event received and safely ignored without state change.',
        eventId: input.eventId,
        originalProcessedAt: existingEvent.processedAt,
      };
    }

    const booking = await prisma.booking.findUnique({
      where: { id: input.bookingId },
    });

    if (!booking) {
      throw new NotFoundError(`Booking with ID '${input.bookingId}' specified in webhook does not exist.`);
    }

    // Guard against underpayment or mismatched transaction amounts
    const bookingAmount = Number(booking.amount);
    const incomingAmount = Number(input.amount);
    if (Math.abs(bookingAmount - incomingAmount) > 0.01) {
      logger.error(
        `Webhook amount mismatch: Webhook specified ${incomingAmount}, but Booking requires ${bookingAmount}`
      );
      throw new BadRequestError(
        `Payment amount mismatch: Expected ${bookingAmount}, received ${incomingAmount}`
      );
    }

    const isSuccess = input.eventType === 'payment.succeeded';
    const paymentStatus = isSuccess ? 'SUCCESS' : 'FAILED';
    const targetBookingStatus = isSuccess ? 'CONFIRMED' : 'FAILED';

    try {
      // Execute atomic transition: persist event log, create payment record, and reconcile booking status
      const result = await prisma.$transaction(async (tx) => {
        // Record idempotency event
        const event = await tx.webhookEvent.create({
          data: {
            eventId: input.eventId,
            eventType: input.eventType,
            payload: JSON.stringify(input),
            status: 'PROCESSED',
          },
        });

        // Check if transaction already exists for this payment provider transactionId
        let payment = await tx.payment.findUnique({
          where: { transactionId: input.transactionId },
        });

        if (!payment) {
          payment = await tx.payment.create({
            data: {
              bookingId: booking.id,
              transactionId: input.transactionId,
              amount: input.amount,
              status: paymentStatus,
              paymentMethod: 'SIMULATED',
              providerReference: `WEBHOOK-PROVIDER-${input.eventId}`,
              errorMessage: isSuccess ? null : 'Payment failed via webhook provider notification',
            },
          });
        }

        // State Machine Transition
        let updatedBooking = booking;
        if (booking.status === 'PENDING') {
          updatedBooking = await tx.booking.update({
            where: { id: booking.id },
            data: { status: targetBookingStatus },
          });
          logger.info(
            `Booking ${booking.id} transitioned from PENDING to ${targetBookingStatus} via webhook`
          );
        } else {
          logger.info(
            `Booking ${booking.id} already in state '${booking.status}'; preserving state without corruption.`
          );
        }

        return {
          status: 'processed',
          eventId: event.eventId,
          transactionId: payment.transactionId,
          bookingId: updatedBooking.id,
          bookingStatus: updatedBooking.status,
          paymentStatus: payment.status,
        };
      });

      return result;
    } catch (error: any) {
      // Handle concurrent race condition where duplicate eventId arrived simultaneously
      if (error.code === 'P2002' && error.meta?.target?.includes('eventId')) {
        logger.warn(`Race condition resolved: Webhook event ${input.eventId} already processed concurrently.`);
        return {
          status: 'already_processed',
          message: 'Duplicate event handled concurrently and safely ignored.',
          eventId: input.eventId,
        };
      }
      throw error;
    }
  }
}

export const webhookService = new WebhookService();
