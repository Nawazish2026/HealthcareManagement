import { z } from 'zod';

export const createCentreSchema = z.object({
  name: z.string().min(2, 'Centre name must be at least 2 characters').trim(),
  address: z.string().min(5, 'Address must be at least 5 characters').trim(),
  city: z.string().min(2, 'City must be at least 2 characters').trim(),
  contactNumber: z.string().min(7, 'Contact number is required').trim(),
});

export const addTestToCentreSchema = z.object({
  testId: z.string().uuid('Valid test UUID is required'),
  price: z.number().positive('Price must be greater than 0'),
  isAvailable: z.boolean().optional().default(true),
});

export const listCentresQuerySchema = z.object({
  city: z.string().optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20).optional(),
});

export type CreateCentreInput = z.infer<typeof createCentreSchema>;
export type AddTestToCentreInput = z.infer<typeof addTestToCentreSchema>;
export type ListCentresQuery = z.infer<typeof listCentresQuerySchema>;
