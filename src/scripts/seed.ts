import prisma from '../db/prisma';
import { hashPassword } from '../utils/security';
import { logger } from '../utils/logger';

async function seed() {
  logger.info('Starting EVE Healthcare database seeding...');

  // 1. Clean existing records in correct foreign key order
  await prisma.webhookEvent.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.centreTest.deleteMany();
  await prisma.diagnosticTest.deleteMany();
  await prisma.diagnosticCentre.deleteMany();
  await prisma.user.deleteMany();

  logger.info('Existing database records cleared.');

  // 2. Create Users
  const adminPassword = await hashPassword('Admin@123456');
  const patientPassword = await hashPassword('Patient@123456');

  const admin = await prisma.user.create({
    data: {
      email: 'admin@evehealthcare.com',
      password: adminPassword,
      fullName: 'System Administrator',
      phone: '+1-212-555-0100',
      role: 'ADMIN',
    },
  });

  const patient1 = await prisma.user.create({
    data: {
      email: 'john.doe@example.com',
      password: patientPassword,
      fullName: 'John Doe',
      phone: '+1-212-555-0101',
      role: 'PATIENT',
    },
  });

  const patient2 = await prisma.user.create({
    data: {
      email: 'sarah.smith@example.com',
      password: patientPassword,
      fullName: 'Sarah Smith',
      phone: '+1-212-555-0102',
      role: 'PATIENT',
    },
  });

  logger.info(`Users seeded: 1 Admin, 2 Patients.`);

  // 3. Create Diagnostic Centres
  const centreDowntown = await prisma.diagnosticCentre.create({
    data: {
      name: 'EVE Diagnostics Central - Downtown',
      address: '450 Health Avenue, Suite 100',
      city: 'New York',
      contactNumber: '+1-212-555-1000',
    },
  });

  const centreBrooklyn = await prisma.diagnosticCentre.create({
    data: {
      name: 'EVE Imaging & Pathology - Brooklyn',
      address: '782 Atlantic Ave',
      city: 'Brooklyn',
      contactNumber: '+1-718-555-2000',
    },
  });

  const centreQueens = await prisma.diagnosticCentre.create({
    data: {
      name: 'EVE Health Hub - Queens',
      address: '108-15 Queens Blvd',
      city: 'Queens',
      contactNumber: '+1-718-555-3000',
    },
  });

  logger.info(`Diagnostic Centres seeded: 3 locations.`);

  // 4. Create Diagnostic Tests
  const testCMP = await prisma.diagnosticTest.create({
    data: {
      name: 'Comprehensive Metabolic Panel (CMP)',
      description: 'Evaluates organ function, electrolytes, blood sugar, kidney and liver enzymes.',
      category: 'Pathology',
      sampleRequired: 'Blood (12-hour fasting)',
    },
  });

  const testCBC = await prisma.diagnosticTest.create({
    data: {
      name: 'Complete Blood Count (CBC)',
      description: 'Measures red blood cells, white blood cells, hemoglobin, hematocrit, and platelets.',
      category: 'Pathology',
      sampleRequired: 'Blood',
    },
  });

  const testLipid = await prisma.diagnosticTest.create({
    data: {
      name: 'Lipid Profile Panel',
      description: 'Measures total cholesterol, HDL, LDL, and triglycerides to evaluate cardiovascular risk.',
      category: 'Pathology',
      sampleRequired: 'Blood (9-12 hours fasting)',
    },
  });

  const testXRay = await prisma.diagnosticTest.create({
    data: {
      name: 'Chest X-Ray (PA & Lateral)',
      description: 'High-resolution digital radiographic imaging of the chest, lungs, and heart silhouette.',
      category: 'Radiology',
      sampleRequired: 'None',
    },
  });

  const testECG = await prisma.diagnosticTest.create({
    data: {
      name: '12-Lead Electrocardiogram (ECG / EKG)',
      description: 'Records electrical activity of the heart to diagnose arrhythmias and ischemia.',
      category: 'Cardiology',
      sampleRequired: 'None',
    },
  });

  const testHbA1c = await prisma.diagnosticTest.create({
    data: {
      name: 'HbA1c Glycated Hemoglobin',
      description: 'Measures average blood sugar levels over the past 2 to 3 months.',
      category: 'Pathology',
      sampleRequired: 'Blood',
    },
  });

  logger.info(`Diagnostic Tests seeded: 6 tests.`);

  // 5. Link Tests to Centres with Prices
  await prisma.centreTest.createMany({
    data: [
      // Downtown centre prices
      { centreId: centreDowntown.id, testId: testCMP.id, price: 45.0, isAvailable: true },
      { centreId: centreDowntown.id, testId: testCBC.id, price: 25.0, isAvailable: true },
      { centreId: centreDowntown.id, testId: testLipid.id, price: 35.0, isAvailable: true },
      { centreId: centreDowntown.id, testId: testXRay.id, price: 80.0, isAvailable: true },
      { centreId: centreDowntown.id, testId: testECG.id, price: 50.0, isAvailable: true },
      { centreId: centreDowntown.id, testId: testHbA1c.id, price: 30.0, isAvailable: true },

      // Brooklyn centre prices (competitive local pricing)
      { centreId: centreBrooklyn.id, testId: testCMP.id, price: 40.0, isAvailable: true },
      { centreId: centreBrooklyn.id, testId: testCBC.id, price: 20.0, isAvailable: true },
      { centreId: centreBrooklyn.id, testId: testLipid.id, price: 30.0, isAvailable: true },
      { centreId: centreBrooklyn.id, testId: testXRay.id, price: 75.0, isAvailable: true },
      { centreId: centreBrooklyn.id, testId: testECG.id, price: 45.0, isAvailable: true },

      // Queens centre prices
      { centreId: centreQueens.id, testId: testCMP.id, price: 42.0, isAvailable: true },
      { centreId: centreQueens.id, testId: testCBC.id, price: 22.0, isAvailable: true },
      { centreId: centreQueens.id, testId: testHbA1c.id, price: 28.0, isAvailable: true },
    ],
  });

  logger.info(`Centre-Test offerings and price catalog seeded.`);

  // 6. Create a sample initial booking for John Doe
  const appointmentTime = new Date();
  appointmentTime.setDate(appointmentTime.getDate() + 3); // 3 days in future

  const booking = await prisma.booking.create({
    data: {
      userId: patient1.id,
      centreId: centreDowntown.id,
      testId: testCMP.id,
      appointmentTime,
      amount: 45.0,
      status: 'PENDING',
      notes: 'Please note patient is diabetic.',
    },
  });

  logger.info(`Sample booking seeded: ID=${booking.id}, Status=PENDING, Amount=$${booking.amount}`);

  logger.info('====================================================');
  logger.info('DATABASE SEEDING COMPLETED SUCCESSFULLY!');
  logger.info('Credentials:');
  logger.info('  Admin:   admin@evehealthcare.com / Admin@123456');
  logger.info('  Patient: john.doe@example.com / Patient@123456');
  logger.info('  Patient: sarah.smith@example.com / Patient@123456');
  logger.info('====================================================');
}

seed()
  .catch((err) => {
    logger.error('Seeding failed with error', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
