import request from 'supertest';
import app from '../src/app';
import prisma from '../src/db/prisma';
import { generateToken } from '../src/utils/security';

describe('3. Booking System Module', () => {
  let patientA: any;
  let patientB: any;
  let tokenA: string;
  let tokenB: string;
  let centre: any;
  let test: any;
  let activeBookingId: string;

  beforeAll(async () => {
    // Look up seeded users and centre
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
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should successfully book a diagnostic test with future appointment', async () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);

    const res = await request(app)
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        centreId: centre.id,
        testId: test.id,
        appointmentTime: futureDate.toISOString(),
        notes: 'Routine checkup fasting test',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('PENDING');
    expect(res.body.data.amount).toBeGreaterThan(0);
    expect(res.body.data.userId).toBe(patientA.id);
    activeBookingId = res.body.data.id;
  });

  it('should reject booking when appointment date is in the past', async () => {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 1);

    const res = await request(app)
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        centreId: centre.id,
        testId: test.id,
        appointmentTime: pastDate.toISOString(),
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should list bookings for authenticated patient', async () => {
    const res = await request(app)
      .get('/api/v1/bookings')
      .set('Authorization', `Bearer ${tokenA}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.some((b: any) => b.id === activeBookingId)).toBe(true);
  });

  it('should prevent Patient B from accessing Patient A booking (403 Forbidden)', async () => {
    const res = await request(app)
      .get(`/api/v1/bookings/${activeBookingId}`)
      .set('Authorization', `Bearer ${tokenB}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  it('should allow Patient A to cancel their own PENDING booking', async () => {
    const res = await request(app)
      .post(`/api/v1/bookings/${activeBookingId}/cancel`)
      .set('Authorization', `Bearer ${tokenA}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('CANCELLED');
  });

  it('should reject cancelling an already CANCELLED booking (409 Conflict)', async () => {
    const res = await request(app)
      .post(`/api/v1/bookings/${activeBookingId}/cancel`)
      .set('Authorization', `Bearer ${tokenA}`);

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('CONFLICT');
  });
});
