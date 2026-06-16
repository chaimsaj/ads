import type { User, PrismaClient } from '@prisma/client';

import type { IUserRepository, CreateUserData } from '../interfaces/user-repository.interface';

export class UserRepository implements IUserRepository {
  constructor(private readonly db: PrismaClient) {}

  async findById(id: string): Promise<User | null> {
    return this.db.user.findFirst({
      where: { id, status: 'ACTIVE' },
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.db.user.findFirst({
      where: { email, status: 'ACTIVE' },
    });
  }

  async create(data: CreateUserData): Promise<User> {
    return this.db.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: data.password,
        phone: data.phone,
        company: data.company,
        verificationCode: data.verificationCode,
        verificationCodeExpiresAt: data.verificationCodeExpiresAt,
        deletedAt: null,
      },
    });
  }

  async update(id: string, data: Partial<Pick<User, 'name' | 'phone' | 'company' | 'avatar'>>): Promise<User> {
    return this.db.user.update({
      where: { id },
      data,
    });
  }

  async incrementFailedAttempts(id: string): Promise<User> {
    return this.db.user.update({
      where: { id },
      data: { failedLoginAttempts: { increment: 1 } },
    });
  }

  async resetFailedAttempts(id: string): Promise<User> {
    return this.db.user.update({
      where: { id },
      data: { failedLoginAttempts: 0, lockedUntil: null },
    });
  }

  async lockAccount(id: string, lockedUntil: Date): Promise<User> {
    return this.db.user.update({
      where: { id },
      data: { lockedUntil },
    });
  }

  async setVerificationCode(id: string, code: string, expiresAt: Date): Promise<User> {
    return this.db.user.update({
      where: { id },
      data: {
        verificationCode: code,
        verificationCodeExpiresAt: expiresAt,
      },
    });
  }

  async verifyEmail(id: string): Promise<User> {
    return this.db.user.update({
      where: { id },
      data: {
        emailVerifiedAt: new Date(),
        verificationCode: null,
        verificationCodeExpiresAt: null,
      },
    });
  }

  async setPasswordResetToken(id: string, tokenHash: string, expiresAt: Date): Promise<User> {
    return this.db.user.update({
      where: { id },
      data: {
        passwordResetToken: tokenHash,
        passwordResetExpiresAt: expiresAt,
      },
    });
  }

  async clearPasswordResetToken(id: string): Promise<User> {
    return this.db.user.update({
      where: { id },
      data: {
        passwordResetToken: null,
        passwordResetExpiresAt: null,
      },
    });
  }

  async updatePassword(id: string, hashedPassword: string): Promise<User> {
    return this.db.user.update({
      where: { id },
      data: { password: hashedPassword },
    });
  }

  async recordLogin(id: string, ip: string): Promise<User> {
    return this.db.user.update({
      where: { id },
      data: {
        lastLoginAt: new Date(),
        lastLoginIp: ip,
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
    });
  }
}
