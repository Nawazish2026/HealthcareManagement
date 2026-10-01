import crypto from 'crypto';
import prisma from '../db/prisma';
import { SimulatePaymentInput } from '../schemas/payment.schema';
import { TokenPayload } from '../types';
import { NotFoundError, ForbiddenError, ConflictError } from '../errors/AppError';
import { logger } from '../utils/logger';

export class PaymentService {
  async processSimulatedPayment(user: TokenPayload, input: SimulatePaymentInput) {
    // 1. Fetch booking
    const booking = await prisma.booking.findUnique({
      where: { id: input.bookingId },
      include: {
        centre: { select: { id: true, name: true } },
        test: { select: { id: true, name: true } },
      },
    });

    if (!booking) {
      throw new NotFoundError(`Booking with ID '${input.bookingId}' not found`);
    }

    // 2. Ownership verification: patient can only pay for their own booking
    if (user.role !== 'ADMIN' && booking.userId !== user.userId) {
      throw new ForbiddenError('You are not authorized to make a payment for this booking');
    }

    // 3. State machine validation
    if (booking.status === 'CONFIRMED') {
      throw new ConflictError('This booking is already confirmed and paid for.');
    }

    if (booking.status === 'CANCELLED') {
      throw new ConflictError('Cannot make a payment for a cancelled booking.');
    }

    if (booking.status === 'FAILED') {
      throw new ConflictError('This booking has previously failed. Please create a new booking.');
    }

    // 4. Determine simulation outcome
    const paymentStatus = input.simulateStatus || 'SUCCESS';
    const newBookingStatus = paymentStatus === 'SUCCESS' ? 'CONFIRMED' : 'FAILED';
    const transactionId = `TXN-${Date.now()}-${crypto.randomUUID().substring(0, 8).toUpperCase()}`;

    logger.info(
      `Processing simulated payment for booking ${booking.id} - Amount: ${booking.amount}, Status: ${paymentStatus}`
    );

    // 5. Execute atomic transaction: record payment and transition booking state
    const [payment, updatedBooking] = await prisma.$transaction([
      prisma.payment.create({
        data: {
          bookingId: booking.id,
          transactionId,
          amount: booking.amount,
          status: paymentStatus,
          paymentMethod: input.paymentMethod || 'SIMULATED',
          providerReference: `MOCK-GATEWAY-REF-${crypto.randomUUID().substring(0, 8).toUpperCase()}`,
          errorMessage: paymentStatus === 'FAILED' ? 'Simulated card decline or insufficient funds' : null,
        },
      }),
      prisma.booking.update({
        where: { id: booking.id },
        data: { status: newBookingStatus },
        include: {
          centre: { select: { id: true, name: true, city: true } },
          test: { select: { id: true, name: true, category: true } },
        },
      }),
    ]);

    return {
      payment: {
        id: payment.id,
        transactionId: payment.transactionId,
        amount: payment.amount,
        status: payment.status,
        paymentMethod: payment.paymentMethod,
        providerReference: payment.providerReference,
        errorMessage: payment.errorMessage,
        createdAt: payment.createdAt,
      },
      booking: {
        id: updatedBooking.id,
        status: updatedBooking.status,
        amount: updatedBooking.amount,
        appointmentTime: updatedBooking.appointmentTime,
        centre: updatedBooking.centre,
        test: updatedBooking.test,
      },
    };
  }
}

export const paymentService = new PaymentService();
