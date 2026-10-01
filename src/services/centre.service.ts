import prisma from '../db/prisma';
import { CreateCentreInput, AddTestToCentreInput, ListCentresQuery } from '../schemas/centre.schema';
import { CreateTestInput, ListTestsQuery } from '../schemas/test.schema';
import { NotFoundError, ConflictError } from '../errors/AppError';

export class CentreService {
  // Centre Operations
  async listCentres(query: ListCentresQuery) {
    const where: any = { isActive: true };

    if (query.city) {
      where.city = { contains: query.city };
    }

    if (query.search) {
      where.OR = [
        { name: { contains: query.search } },
        { address: { contains: query.search } },
        { city: { contains: query.search } },
      ];
    }

    const centres = await prisma.diagnosticCentre.findMany({
      where,
      include: {
        centreTests: {
          where: { isAvailable: true },
          include: {
            test: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    return centres.map((centre) => ({
      id: centre.id,
      name: centre.name,
      address: centre.address,
      city: centre.city,
      contactNumber: centre.contactNumber,
      availableTests: centre.centreTests.map((ct) => ({
        centreTestId: ct.id,
        testId: ct.test.id,
        name: ct.test.name,
        category: ct.test.category,
        description: ct.test.description,
        sampleRequired: ct.test.sampleRequired,
        price: ct.price,
        isAvailable: ct.isAvailable,
      })),
      createdAt: centre.createdAt,
    }));
  }

  async getCentreById(id: string) {
    const centre = await prisma.diagnosticCentre.findUnique({
      where: { id },
      include: {
        centreTests: {
          where: { isAvailable: true },
          include: {
            test: true,
          },
        },
      },
    });

    if (!centre) {
      throw new NotFoundError(`Diagnostic centre with ID '${id}' not found`);
    }

    return {
      id: centre.id,
      name: centre.name,
      address: centre.address,
      city: centre.city,
      contactNumber: centre.contactNumber,
      availableTests: centre.centreTests.map((ct) => ({
        centreTestId: ct.id,
        testId: ct.test.id,
        name: ct.test.name,
        category: ct.test.category,
        description: ct.test.description,
        sampleRequired: ct.test.sampleRequired,
        price: ct.price,
        isAvailable: ct.isAvailable,
      })),
      createdAt: centre.createdAt,
    };
  }

  async createCentre(input: CreateCentreInput) {
    return prisma.diagnosticCentre.create({
      data: input,
    });
  }

  // Test Operations
  async listTests(query: ListTestsQuery) {
    const where: any = { isActive: true };

    if (query.category) {
      where.category = { contains: query.category };
    }

    if (query.search) {
      where.OR = [
        { name: { contains: query.search } },
        { description: { contains: query.search } },
      ];
    }

    return prisma.diagnosticTest.findMany({
      where,
      orderBy: { name: 'asc' },
    });
  }

  async createTest(input: CreateTestInput) {
    return prisma.diagnosticTest.create({
      data: input,
    });
  }

  // Association: Add or update test offering at centre with price
  async addTestToCentre(centreId: string, input: AddTestToCentreInput) {
    // Validate centre exists
    const centre = await prisma.diagnosticCentre.findUnique({
      where: { id: centreId },
    });
    if (!centre) {
      throw new NotFoundError(`Diagnostic centre with ID '${centreId}' not found`);
    }

    // Validate test exists
    const test = await prisma.diagnosticTest.findUnique({
      where: { id: input.testId },
    });
    if (!test) {
      throw new NotFoundError(`Diagnostic test with ID '${input.testId}' not found`);
    }

    // Upsert association
    return prisma.centreTest.upsert({
      where: {
        centreId_testId: {
          centreId,
          testId: input.testId,
        },
      },
      update: {
        price: input.price,
        isAvailable: input.isAvailable ?? true,
      },
      create: {
        centreId,
        testId: input.testId,
        price: input.price,
        isAvailable: input.isAvailable ?? true,
      },
      include: {
        centre: { select: { id: true, name: true } },
        test: { select: { id: true, name: true, category: true } },
      },
    });
  }
}

export const centreService = new CentreService();
