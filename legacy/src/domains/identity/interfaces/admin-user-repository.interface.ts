import type { AdminUser } from '@prisma/client';

export interface IAdminUserRepository {
  findById(id: string): Promise<AdminUser | null>;
  findByEmail(email: string): Promise<AdminUser | null>;
  incrementFailedAttempts(id: string): Promise<AdminUser>;
  resetFailedAttempts(id: string): Promise<AdminUser>;
  lockAccount(id: string, lockedUntil: Date): Promise<AdminUser>;
  recordLogin(id: string, ip: string): Promise<AdminUser>;
  updatePassword(id: string, hashedPassword: string): Promise<AdminUser>;
  setTwoFactorSecret(id: string, secret: string): Promise<AdminUser>;
  enableTwoFactor(id: string): Promise<AdminUser>;
  disableTwoFactor(id: string): Promise<AdminUser>;
}
