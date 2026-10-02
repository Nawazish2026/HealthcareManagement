import { Prisma } from '@prisma/client';
import prisma from '../db/prisma';
import { CreateBookingInput, ListBookingsQuery } from '../schemas/booking.schema';
import {
  NotFoundError,
  BadRequestError,
  ForbiddenError,
  ConflictError,
} from '../errors/AppError';
import { TokenPayload } from '../types';

export class BookingService {
  async createBooking(user: TokenPayload, input: CreateBookingInput) {
    // Single query validates centre, test, and active offering relationship in one roundtrip
    const centreTest = await prisma.centreTest.findUnique({
      where: {
        centreId_testId: {
          centreId: input.centreId,
          testId: input.testId,
        },
      },
      include: {
        centre: true,
        test: true,
      },
    });

    if (!centreTest) {
      const [centre, test] = await Promise.all([
        prisma.diagnosticCentre.findUnique({ where: { id: input.centreId } }),
        prisma.diagnosticTest.findUnique({ where: { id: input.testId } }),
      ]);
      if (!centre || !centre.isActive) {
        throw new NotFoundError(`Diagnostic centre not found or currently inactive`);
      }
      if (!test || !test.isActive) {
        throw new NotFoundError(`Diagnostic test not found or currently inactive`);
      }
      throw new BadRequestError(
        `The test '${test.name}' is not currently available at '${centre.name}'`
      );
    }

    if (!centreTest.centre.isActive) {
      throw new NotFoundError(`Diagnostic centre not found or currently inactive`);
    }

    if (!centreTest.test.isActive) {
      throw new NotFoundError(`Diagnostic test not found or currently inactive`);
    }

    if (!centreTest.isAvailable) {
      throw new BadRequestError(
        `The test '${centreTest.test.name}' is not currently available at '${centreTest.centre.name}'`
      );
    }

    const appointmentDate = new Date(input.appointmentTime);
    if (appointmentDate <= new Date()) {
      throw new BadRequestError('Appointment date and time must be in the future');
    }

    // Amount is derived directly from the server catalogue to prevent client tampering
    const booking = await prisma.booking.create({
      data: {
        userId: user.userId,
        centreId: input.centreId,
        testId: input.testId,
        appointmentTime: appointmentDate,
        amount: centreTest.price,
        status: 'PENDING',
        notes: input.notes,
      },
      include: {
        centre: {
          select: { id: true, name: true, address: true, city: true, contactNumber: true },
        },
        test: {
          select: { id: true, name: true, category: true, sampleRequired: true },
        },
        user: {
          select: { id: true, fullName: true, email: true, phone: true },
        },
      },
    });

    return booking;
  }

  async listBookings(user: TokenPayload, query: ListBookingsQuery) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    const where: Prisma.BookingWhereInput = {};

    // Patient can only view their own bookings; Admin can view all or filter
    if (user.role !== 'ADMIN') {
      where.userId = user.userId;
    }

    if (query.status) {
      where.status = query.status;
    }

    if (query.centreId) {
      where.centreId = query.centreId;
    }

    const [total, bookings] = await Promise.all([
      prisma.booking.count({ where }),
      prisma.booking.findMany({
        where,
        skip,
        take: limit,
        include: {
          centre: {
            select: { id: true, name: true, city: true },
          },
          test: {
            select: { id: true, name: true, category: true },
          },
          payments: {
            select: { id: true, transactionId: true, amount: true, status: true, createdAt: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return {
      bookings,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getBookingById(user: TokenPayload, bookingId: string) {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        centre: true,
        test: true,
        user: {
          select: { id: true, fullName: true, email: true, phone: true },
        },
        payments: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!booking) {
      throw new NotFoundError(`Booking with ID '${bookingId}' not found`);
    }

    // Authorization check: patient can only view their own booking
    if (user.role !== 'ADMIN' && booking.userId !== user.userId) {
      throw new ForbiddenError('You do not have permission to view this booking');
    }

    return booking;
  }

  async cancelBooking(user: TokenPayload, bookingId: string) {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) {
      throw new NotFoundError(`Booking with ID '${bookingId}' not found`);
    }

    // Ownership check
    if (user.role !== 'ADMIN' && booking.userId !== user.userId) {
      throw new ForbiddenError('You do not have permission to cancel this booking');
    }

    // State machine check
    if (booking.status === 'CANCELLED') {
      throw new ConflictError('Booking is already cancelled');
    }

    if (booking.status === 'CONFIRMED') {
      throw new ConflictError('Cannot directly cancel a confirmed booking. Please initiate refund/reschedule.');
    }

    if (booking.status !== 'PENDING') {
      throw new ConflictError(`Cannot cancel a booking in '${booking.status}' state`);
    }

    return prisma.booking.update({
      where: { id: bookingId },
      data: { status: 'CANCELLED' },
      include: {
        centre: { select: { id: true, name: true } },
        test: { select: { id: true, name: true } },
      },
    });
  }
}

export const bookingService = new BookingService();
