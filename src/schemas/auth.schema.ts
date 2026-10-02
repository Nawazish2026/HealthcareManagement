import { z } from 'zod';

export const signupSchema = z.object({
  email: z.string().email('Please provide a valid email address').toLowerCase().trim(),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
  fullName: z.string().min(2, 'Full name must be at least 2 characters long').trim(),
  phone: z.string().optional(),
  // NOTE: 'role' deliberately excluded from public signup to prevent privilege escalation.
  // All public registrations default to PATIENT. Admin accounts are seeded or created via admin-only APIs.
});

export const loginSchema = z.object({
  email: z.string().email('Please provide a valid email address').toLowerCase().trim(),
  password: z.string().min(1, 'Password is required'),
});

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
