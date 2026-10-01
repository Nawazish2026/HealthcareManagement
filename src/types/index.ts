import { Request } from 'express';

export type UserRole = 'PATIENT' | 'ADMIN';

export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'FAILED' | 'CANCELLED';

export type PaymentStatus = 'SUCCESS' | 'FAILED' | 'PENDING';

export type PaymentMethod = 'CARD' | 'UPI' | 'NET_BANKING' | 'SIMULATED';

export type WebhookStatus = 'PROCESSED' | 'DUPLICATE_IGNORED' | 'FAILED';

export interface TokenPayload {
  userId: string;
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

export interface AuthenticatedRequest extends Request {
  user?: TokenPayload;
  requestId?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}
