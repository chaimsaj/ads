import type { User } from '@prisma/client';

export interface IUserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  create(data: CreateUserData): Promise<User>;
  update(id: string, data: UpdateUserData): Promise<User>;
  incrementFailedAttempts(id: string): Promise<User>;
  resetFailedAttempts(id: string): Promise<User>;
  lockAccount(id: string, lockedUntil: Date): Promise<User>;
  setVerificationCode(id: string, code: string, expiresAt: Date): Promise<User>;
  verifyEmail(id: string): Promise<User>;
  setPasswordResetToken(id: string, tokenHash: string, expiresAt: Date): Promise<User>;
  clearPasswordResetToken(id: string): Promise<User>;
  updatePassword(id: string, hashedPassword: string): Promise<User>;
  recordLogin(id: string, ip: string): Promise<User>;
}

export interface CreateUserData {
  readonly name: string;
  readonly email: string;
  readonly password: string;
  readonly phone?: string;
  readonly company?: string;
  readonly verificationCode: string;
  readonly verificationCodeExpiresAt: Date;
}

export interface UpdateUserData {
  readonly name?: string;
  readonly phone?: string;
  readonly company?: string;
  readonly avatar?: string;
}
