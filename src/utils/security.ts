import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { config } from '../config';
import { TokenPayload } from '../types';

export const hashPassword = async (password: string): Promise<string> => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

export const comparePassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

export const generateToken = (payload: Omit<TokenPayload, 'iat' | 'exp'>): string => {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  } as jwt.SignOptions);
};

export const verifyToken = (token: string): TokenPayload => {
  return jwt.verify(token, config.jwt.secret) as TokenPayload;
};

export const generateWebhookSignature = (payload: any, secret?: string): string => {
  const data = typeof payload === 'string' ? payload : JSON.stringify(payload);
  const key = secret || config.webhook.secret;
  return crypto.createHmac('sha256', key).update(data).digest('hex');
};

export const verifyWebhookSignature = (
  payload: any,
  signature: string,
  secret?: string
): boolean => {
  try {
    const expected = generateWebhookSignature(payload, secret);
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  } catch {
    return false;
  }
};
