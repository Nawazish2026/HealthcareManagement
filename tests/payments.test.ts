import request from 'supertest';
import app from '../src/app';
import prisma from '../src/db/prisma';
import { generateToken } from '../src/utils/security';

describe('Payment Simulation & Ledger', () => {
  let patientA: any;
  let patientB: any;
  let tokenA: string;
  let tokenB: string;
  let centre: any;
  let test: any;
  let successBookingId: string;
  let failedBookingId: string;

  beforeAll(async () => {
    patientA = await prisma.user.findUnique({ where: { email: 'john.doe@example.com' } });
    patientB = await prisma.user.findUnique({ where: { email: 'sarah.smith@example.com' } });

    tokenA = generateToken({ userId: patientA.id, email: patientA.email, role: 'PATIENT' });
    tokenB = generateToken({ userId: patientB.id, email: patientB.email, role: 'PATIENT' });

    centre = await prisma.diagnosticCentre.findFirst();
    const centreTest = await prisma.centreTest.findFirst({
      where: { centreId: centre.id, isAvailable: true },
      include: { test: true },
    });
    test = centreTest!.test;

    // Create 2 test bookings in PENDING state
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 5);

    const b1 = await prisma.booking.create({
      data: {
        userId: patientA.id,
        centreId: centre.id,
        testId: test.id,
        appointmentTime: futureDate,
        amount: centreTest!.price,
        status: 'PENDING',
      },
    });
    successBookingId = b1.id;

    const b2 = await prisma.booking.create({
      data: {
        userId: patientA.id,
        centreId: centre.id,
        testId: test.id,
        appointmentTime: futureDate,
        amount: centreTest!.price,
        status: 'PENDING',
      },
    });
    failedBookingId = b2.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should reject payment if user does not own the booking (403 Forbidden)', async () => {
    const res = await request(app)
      .post('/payments')
      .set('Authorization', `Bearer ${tokenB}`) // User B trying to pay User A's booking
      .send({
        bookingId: successBookingId,
        paymentMethod: 'CARD',
      });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('should process successful simulated payment and update booking to CONFIRMED', async () => {
    const res = await request(app)
      .post('/payments')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        bookingId: successBookingId,
        paymentMethod: 'UPI',
        simulateStatus: 'SUCCESS',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.payment.status).toBe('SUCCESS');
    expect(res.body.data.payment.transactionId).toBeDefined();
    expect(res.body.data.booking.status).toBe('CONFIRMED');

    // Verify in database
    const dbBooking = await prisma.booking.findUnique({ where: { id: successBookingId } });
    expect(dbBooking?.status).toBe('CONFIRMED');
  });

  it('should reject payment on an already CONFIRMED booking (409 Conflict)', async () => {
    const res = await request(app)
      .post('/payments')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        bookingId: successBookingId,
        paymentMethod: 'CARD',
      });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  it('should process failed simulated payment and update booking to FAILED', async () => {
    const res = await request(app)
      .post('/payments')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        bookingId: failedBookingId,
        paymentMethod: 'CARD',
        simulateStatus: 'FAILED',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.payment.status).toBe('FAILED');
    expect(res.body.data.booking.status).toBe('FAILED');

    // Verify in database
    const dbBooking = await prisma.booking.findUnique({ where: { id: failedBookingId } });
    expect(dbBooking?.status).toBe('FAILED');
  });
});
