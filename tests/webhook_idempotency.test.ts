import request from 'supertest';
import app from '../src/app';
import prisma from '../src/db/prisma';

describe('5. Payment Webhook & Strict Idempotency Module', () => {
  let webhookBookingId: string;
  const bookingAmount = 45.0;

  beforeAll(async () => {
    const user = await prisma.user.findFirst();
    const centre = await prisma.diagnosticCentre.findFirst();
    const test = await prisma.diagnosticTest.findFirst();

    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 10);

    const booking = await prisma.booking.create({
      data: {
        userId: user!.id,
        centreId: centre!.id,
        testId: test!.id,
        appointmentTime: futureDate,
        amount: bookingAmount,
        status: 'PENDING',
      },
    });

    webhookBookingId = booking.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should process webhook event on first delivery and confirm booking', async () => {
    const eventId = `evt_first_delivery_${Date.now()}`;
    const transactionId = `txn_provider_${Date.now()}`;

    const res = await request(app)
      .post('/payments/webhook')
      .send({
        eventId,
        eventType: 'payment.succeeded',
        bookingId: webhookBookingId,
        transactionId,
        amount: bookingAmount,
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('processed');
    expect(res.body.data.bookingStatus).toBe('CONFIRMED');

    // Verify booking in DB
    const updatedBooking = await prisma.booking.findUnique({
      where: { id: webhookBookingId },
    });
    expect(updatedBooking?.status).toBe('CONFIRMED');

    // Verify only 1 payment was created
    const payments = await prisma.payment.findMany({
      where: { transactionId },
    });
    expect(payments.length).toBe(1);
  });

  it('IDEMPOTENCY: should safely ignore repeated delivery of the same webhook event', async () => {
    const eventId = `evt_idempotent_test_${Date.now()}`;
    const transactionId = `txn_idempotent_${Date.now()}`;

    const webhookPayload = {
      eventId,
      eventType: 'payment.succeeded',
      bookingId: webhookBookingId,
      transactionId,
      amount: bookingAmount,
    };

    // 1st delivery
    const res1 = await request(app)
      .post('/payments/webhook')
      .send(webhookPayload);

    expect(res1.status).toBe(200);
    expect(res1.body.data.status).toBe('processed');

    // 2nd delivery (identical eventId)
    const res2 = await request(app)
      .post('/payments/webhook')
      .send(webhookPayload);

    expect(res2.status).toBe(200);
    expect(res2.body.success).toBe(true);
    expect(res2.body.data.status).toBe('already_processed');
    expect(res2.body.data.message).toContain('Duplicate event');

    // 3rd delivery (identical eventId)
    const res3 = await request(app)
      .post('/payments/webhook')
      .send(webhookPayload);

    expect(res3.status).toBe(200);
    expect(res3.body.data.status).toBe('already_processed');

    // Verify no duplicate payments created
    const payments = await prisma.payment.findMany({
      where: { transactionId },
    });
    expect(payments.length).toBe(1);
  });

  it('RACE CONDITION RESILIENCE: concurrent webhook requests with identical eventId must remain idempotent', async () => {
    const concurrentEventId = `evt_race_${Date.now()}`;
    const concurrentTxnId = `txn_race_${Date.now()}`;

    const payload = {
      eventId: concurrentEventId,
      eventType: 'payment.succeeded',
      bookingId: webhookBookingId,
      transactionId: concurrentTxnId,
      amount: bookingAmount,
    };

    // Fire 5 concurrent requests with the identical eventId
    const responses = await Promise.all([
      request(app).post('/payments/webhook').send(payload),
      request(app).post('/payments/webhook').send(payload),
      request(app).post('/payments/webhook').send(payload),
      request(app).post('/payments/webhook').send(payload),
      request(app).post('/payments/webhook').send(payload),
    ]);

    // All must return HTTP 200 without 500 error
    responses.forEach((res) => {
      expect(res.status).toBe(200);
    });

    // Exactly one should be 'processed', others 'already_processed'
    const processedCount = responses.filter((r) => r.body.data.status === 'processed').length;
    const ignoredCount = responses.filter((r) => r.body.data.status === 'already_processed').length;

    expect(processedCount).toBe(1);
    expect(ignoredCount).toBe(4);

    // Verify single payment in database
    const payments = await prisma.payment.findMany({
      where: { transactionId: concurrentTxnId },
    });
    expect(payments.length).toBe(1);
  });

  it('should reject webhook for non-existent booking ID (404 Not Found)', async () => {
    const res = await request(app)
      .post('/payments/webhook')
      .send({
        eventId: `evt_missing_${Date.now()}`,
        eventType: 'payment.succeeded',
        bookingId: '00000000-0000-0000-0000-000000000000',
        transactionId: `txn_missing_${Date.now()}`,
        amount: 45.0,
      });

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  it('should reject webhook when amount mismatches booking amount (400 Bad Request)', async () => {
    const res = await request(app)
      .post('/payments/webhook')
      .send({
        eventId: `evt_mismatch_${Date.now()}`,
        eventType: 'payment.succeeded',
        bookingId: webhookBookingId,
        transactionId: `txn_mismatch_${Date.now()}`,
        amount: 999.99, // Mismatched amount
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.message).toContain('amount mismatch');
  });
});
