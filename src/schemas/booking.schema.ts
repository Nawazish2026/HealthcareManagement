import { z } from 'zod';

export const createBookingSchema = z.object({
  centreId: z.string().uuid('Valid centre UUID is required'),
  testId: z.string().uuid('Valid test UUID is required'),
  appointmentTime: z
    .string()
    .datetime({ message: 'Appointment time must be a valid ISO 8601 datetime string' })
    .refine(
      (val) => new Date(val) > new Date(),
      'Appointment time must be scheduled in the future'
    ),
  notes: z.string().max(500, 'Notes cannot exceed 500 characters').optional(),
});

export const listBookingsQuerySchema = z.object({
  status: z.enum(['PENDING', 'CONFIRMED', 'FAILED', 'CANCELLED']).optional(),
  centreId: z.string().uuid().optional(),
});

export type CreateBookingInput = z.infer<typeof createBookingSchema>;
export type ListBookingsQuery = z.infer<typeof listBookingsQuerySchema>;
