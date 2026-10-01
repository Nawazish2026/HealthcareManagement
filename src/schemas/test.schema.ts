import { z } from 'zod';

export const createTestSchema = z.object({
  name: z.string().min(2, 'Test name must be at least 2 characters').trim(),
  description: z.string().optional(),
  category: z.string().min(2, 'Category is required (e.g. Pathology, Radiology, Cardiology)').trim(),
  sampleRequired: z.string().optional(), // e.g. Blood, Urine, Fasting, None
});

export const listTestsQuerySchema = z.object({
  category: z.string().optional(),
  search: z.string().optional(),
});

export type CreateTestInput = z.infer<typeof createTestSchema>;
export type ListTestsQuery = z.infer<typeof listTestsQuerySchema>;
