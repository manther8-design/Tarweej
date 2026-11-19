import { createHash, randomBytes, randomInt } from 'node:crypto';
import * as bcrypt from 'bcryptjs';

export async function hashPassword(plain: string, rounds: number): Promise<string> {
  return bcrypt.hash(plain, rounds);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function generateRefreshToken(): string {
  return randomBytes(48).toString('base64url');
}

export function generateOtpCode(length: number): string {
  const max = 10 ** length;
  const value = randomInt(0, max);
  return value.toString().padStart(length, '0');
}

export async function hashOtpCode(code: string): Promise<string> {
  return bcrypt.hash(code, 8);
}

export async function verifyOtpCode(code: string, hash: string): Promise<boolean> {
  return bcrypt.compare(code, hash);
}
