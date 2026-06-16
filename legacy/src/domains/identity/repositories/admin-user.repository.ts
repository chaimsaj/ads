import type { AdminUser, PrismaClient } from '@prisma/client';

import type { IAdminUserRepository } from '../interfaces/admin-user-repository.interface';

export class AdminUserRepository implements IAdminUserRepository {
  constructor(private readonly db: PrismaClient) {}

  async findById(id: string): Promise<AdminUser | null> {
    return this.db.adminUser.findFirst({
      where: { id, status: 'ACTIVE' },
    });
  }

  async findByEmail(email: string): Promise<AdminUser | null> {
    return this.db.adminUser.findFirst({
      where: { email, status: 'ACTIVE' },
    });
  }

  async incrementFailedAttempts(id: string): Promise<AdminUser> {
    return this.db.adminUser.update({
      where: { id },
      data: { failedLoginAttempts: { increment: 1 } },
    });
  }

  async resetFailedAttempts(id: string): Promise<AdminUser> {
    return this.db.adminUser.update({
      where: { id },
      data: { failedLoginAttempts: 0, lockedUntil: null },
    });
  }

  async lockAccount(id: string, lockedUntil: Date): Promise<AdminUser> {
    return this.db.adminUser.update({
      where: { id },
      data: { lockedUntil },
    });
  }

  async recordLogin(id: string, ip: string): Promise<AdminUser> {
    return this.db.adminUser.update({
      where: { id },
      data: {
        lastLoginAt: new Date(),
        lastLoginIp: ip,
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
    });
  }

  async updatePassword(id: string, hashedPassword: string): Promise<AdminUser> {
    return this.db.adminUser.update({
      where: { id },
      data: { password: hashedPassword },
    });
  }

  async setTwoFactorSecret(id: string, secret: string): Promise<AdminUser> {
    return this.db.adminUser.update({
      where: { id },
      data: { twoFactorSecret: secret },
    });
  }

  async enableTwoFactor(id: string): Promise<AdminUser> {
    return this.db.adminUser.update({
      where: { id },
      data: { twoFactorEnabled: true },
    });
  }

  async disableTwoFactor(id: string): Promise<AdminUser> {
    return this.db.adminUser.update({
      where: { id },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
      },
    });
  }
}
