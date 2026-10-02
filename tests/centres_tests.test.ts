import request from 'supertest';
import app from '../src/app';
import prisma from '../src/db/prisma';
import { generateToken } from '../src/utils/security';

describe('Diagnostic Centres & Test Offerings', () => {
  let adminToken: string;
  let patientToken: string;
  let testCentreId: string;
  let testTestId: string;

  beforeAll(async () => {
    // Generate valid tokens
    adminToken = generateToken({
      userId: 'mock-admin-uuid',
      email: 'admin@evehealthcare.com',
      role: 'ADMIN',
    });

    patientToken = generateToken({
      userId: 'mock-patient-uuid',
      email: 'patient@example.com',
      role: 'PATIENT',
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should list all diagnostic centres with available tests and prices', async () => {
    const res = await request(app).get('/api/v1/centres');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    if (res.body.data.length > 0) {
      const centre = res.body.data[0];
      expect(centre.name).toBeDefined();
      expect(centre.city).toBeDefined();
      expect(Array.isArray(centre.availableTests)).toBe(true);
      testCentreId = centre.id;
    }
  });

  it('should filter centres by city query param', async () => {
    const res = await request(app).get('/api/v1/centres?city=New York');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    res.body.data.forEach((c: any) => {
      expect(c.city).toContain('New York');
    });
  });

  it('should list all diagnostic tests in the master catalog', async () => {
    const res = await request(app).get('/api/v1/tests');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    if (res.body.data.length > 0) {
      testTestId = res.body.data[0].id;
    }
  });

  it('should allow ADMIN to create a new diagnostic centre', async () => {
    const newCentre = {
      name: `Test Centre ${Date.now()}`,
      address: '100 Medical Plaza',
      city: 'Boston',
      contactNumber: '+1-617-555-0100',
    };

    const res = await request(app)
      .post('/api/v1/centres')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(newCentre);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe(newCentre.name);
  });

  it('should reject centre creation from a PATIENT (403 Forbidden)', async () => {
    const res = await request(app)
      .post('/api/v1/centres')
      .set('Authorization', `Bearer ${patientToken}`)
      .send({
        name: 'Unauthorized Centre',
        address: '123 Fake St',
        city: 'Nowhere',
        contactNumber: '+1-555-0000',
      });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  it('should allow ADMIN to add/update test offering with price at centre', async () => {
    if (!testCentreId || !testTestId) return;

    const res = await request(app)
      .post(`/api/v1/centres/${testCentreId}/tests`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        testId: testTestId,
        price: 55.0,
        isAvailable: true,
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.price).toBe(55.0);
  });
});
