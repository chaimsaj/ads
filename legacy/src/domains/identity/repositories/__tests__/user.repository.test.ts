import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { PrismaClient, User } from '@prisma/client';

import { mockObjectId } from '../../../../../tests/helpers/objectid-helper';
import { UserRepository } from '../user.repository';
import type { CreateUserData } from '../../interfaces/user-repository.interface';

describe('UserRepository', () => {
  let repository: UserRepository;
  let mockPrisma: {
    user: {
      findFirst: ReturnType<typeof vi.fn>;
      create: ReturnType<typeof vi.fn>;
      update: ReturnType<typeof vi.fn>;
    };
  };

  const mockUser: User = {
    id: mockObjectId(1),
    name: 'Test User',
    email: 'test@example.com',
    password: 'hashedpassword',
    phone: '1234567890',
    company: 'Test Corp',
    avatar: null,
    role: 'advertiser',
    emailVerifiedAt: null,
    verificationCode: null,
    verificationCodeExpiresAt: null,
    passwordResetToken: null,
    passwordResetExpiresAt: null,
    failedLoginAttempts: 0,
    lockedUntil: null,
    lastLoginAt: null,
    lastLoginIp: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };

  beforeEach(() => {
    mockPrisma = {
      user: {
        findFirst: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      },
    };

    repository = new UserRepository(mockPrisma as unknown as PrismaClient);
  });

  describe('findById', () => {
    it('should find user by id with deletedAt null', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(mockUser);

      const result = await repository.findById(mockObjectId(1));

      expect(mockPrisma.user.findFirst).toHaveBeenCalledWith({
        where: { id: mockObjectId(1), deletedAt: null },
      });
      expect(result).toEqual(mockUser);
    });

    it('should return null when user not found', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(null);

      const result = await repository.findById(mockObjectId(999));

      expect(result).toBeNull();
    });

    it('should return null for deleted user', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(null);

      const result = await repository.findById(mockObjectId(1));

      expect(mockPrisma.user.findFirst).toHaveBeenCalledWith({
        where: { id: mockObjectId(1), deletedAt: null },
      });
      expect(result).toBeNull();
    });
  });

  describe('findByEmail', () => {
    it('should find user by email with deletedAt null', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(mockUser);

      const result = await repository.findByEmail('test@example.com');

      expect(mockPrisma.user.findFirst).toHaveBeenCalledWith({
        where: { email: 'test@example.com', deletedAt: null },
      });
      expect(result).toEqual(mockUser);
    });

    it('should return null when email not found', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(null);

      const result = await repository.findByEmail('notfound@example.com');

      expect(result).toBeNull();
    });

    it('should handle case-sensitive email lookup', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(null);

      await repository.findByEmail('Test@Example.com');

      expect(mockPrisma.user.findFirst).toHaveBeenCalledWith({
        where: { email: 'Test@Example.com', deletedAt: null },
      });
    });
  });

  describe('create', () => {
    const createData: CreateUserData = {
      name: 'New User',
      email: 'new@example.com',
      password: 'hashedpassword',
      phone: '9876543210',
      company: 'New Corp',
      verificationCode: '123456',
      verificationCodeExpiresAt: new Date('2024-01-01T12:00:00Z'),
    };

    it('should create user with all fields', async () => {
      mockPrisma.user.create.mockResolvedValue({ ...mockUser, ...createData, id: mockObjectId(2) });

      const result = await repository.create(createData);

      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: {
          name: 'New User',
          email: 'new@example.com',
          password: 'hashedpassword',
          phone: '9876543210',
          company: 'New Corp',
          verificationCode: '123456',
          verificationCodeExpiresAt: createData.verificationCodeExpiresAt,
        },
      });
      expect(result.id).toBe(mockObjectId(2));
    });

    it('should create user without optional fields', async () => {
      const minimalData: CreateUserData = {
        name: 'Minimal User',
        email: 'minimal@example.com',
        password: 'hashedpassword',
        verificationCode: '654321',
        verificationCodeExpiresAt: new Date(),
      };

      mockPrisma.user.create.mockResolvedValue({ ...mockUser, ...minimalData, id: mockObjectId(3) });

      await repository.create(minimalData);

      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: {
          name: 'Minimal User',
          email: 'minimal@example.com',
          password: 'hashedpassword',
          phone: undefined,
          company: undefined,
          verificationCode: '654321',
          verificationCodeExpiresAt: minimalData.verificationCodeExpiresAt,
        },
      });
    });
  });

  describe('update', () => {
    it('should update user name', async () => {
      mockPrisma.user.update.mockResolvedValue({ ...mockUser, name: 'Updated Name' });

      const result = await repository.update(mockObjectId(1), { name: 'Updated Name' });

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: mockObjectId(1) },
        data: { name: 'Updated Name' },
      });
      expect(result.name).toBe('Updated Name');
    });

    it('should update multiple fields', async () => {
      const updateData = { name: 'New Name', phone: '5555555555', company: 'New Company' };
      mockPrisma.user.update.mockResolvedValue({ ...mockUser, ...updateData });

      await repository.update(mockObjectId(1), updateData);

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: mockObjectId(1) },
        data: updateData,
      });
    });

    it('should update avatar', async () => {
      mockPrisma.user.update.mockResolvedValue({ ...mockUser, avatar: 'new-avatar.png' });

      await repository.update(mockObjectId(1), { avatar: 'new-avatar.png' });

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: mockObjectId(1) },
        data: { avatar: 'new-avatar.png' },
      });
    });
  });

  describe('incrementFailedAttempts', () => {
    it('should increment failed login attempts', async () => {
      mockPrisma.user.update.mockResolvedValue({ ...mockUser, failedLoginAttempts: 1 });

      const result = await repository.incrementFailedAttempts(mockObjectId(1));

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: mockObjectId(1) },
        data: { failedLoginAttempts: { increment: 1 } },
      });
      expect(result.failedLoginAttempts).toBe(1);
    });
  });

  describe('resetFailedAttempts', () => {
    it('should reset failed attempts and clear lock', async () => {
      mockPrisma.user.update.mockResolvedValue({
        ...mockUser,
        failedLoginAttempts: 0,
        lockedUntil: null,
      });

      const result = await repository.resetFailedAttempts(mockObjectId(1));

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: mockObjectId(1) },
        data: { failedLoginAttempts: 0, lockedUntil: null },
      });
      expect(result.failedLoginAttempts).toBe(0);
      expect(result.lockedUntil).toBeNull();
    });
  });

  describe('lockAccount', () => {
    it('should set account lock until date', async () => {
      const lockDate = new Date('2024-01-01T12:00:00Z');
      mockPrisma.user.update.mockResolvedValue({ ...mockUser, lockedUntil: lockDate });

      const result = await repository.lockAccount(mockObjectId(1), lockDate);

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: mockObjectId(1) },
        data: { lockedUntil: lockDate },
      });
      expect(result.lockedUntil).toEqual(lockDate);
    });
  });

  describe('setVerificationCode', () => {
    it('should set verification code and expiry', async () => {
      const expiresAt = new Date('2024-01-01T12:00:00Z');
      mockPrisma.user.update.mockResolvedValue({
        ...mockUser,
        verificationCode: '123456',
        verificationCodeExpiresAt: expiresAt,
      });

      const result = await repository.setVerificationCode(mockObjectId(1), '123456', expiresAt);

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: mockObjectId(1) },
        data: {
          verificationCode: '123456',
          verificationCodeExpiresAt: expiresAt,
        },
      });
      expect(result.verificationCode).toBe('123456');
    });
  });

  describe('verifyEmail', () => {
    it('should set emailVerifiedAt and clear verification code', async () => {
      const verifiedUser = {
        ...mockUser,
        emailVerifiedAt: expect.any(Date),
        verificationCode: null,
        verificationCodeExpiresAt: null,
      };
      mockPrisma.user.update.mockResolvedValue(verifiedUser);

      await repository.verifyEmail(mockObjectId(1));

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: mockObjectId(1) },
        data: {
          emailVerifiedAt: expect.any(Date),
          verificationCode: null,
          verificationCodeExpiresAt: null,
        },
      });
    });
  });

  describe('setPasswordResetToken', () => {
    it('should set password reset token and expiry', async () => {
      const expiresAt = new Date('2024-01-01T12:00:00Z');
      mockPrisma.user.update.mockResolvedValue({
        ...mockUser,
        passwordResetToken: 'hashedtoken',
        passwordResetExpiresAt: expiresAt,
      });

      const result = await repository.setPasswordResetToken(mockObjectId(1), 'hashedtoken', expiresAt);

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: mockObjectId(1) },
        data: {
          passwordResetToken: 'hashedtoken',
          passwordResetExpiresAt: expiresAt,
        },
      });
      expect(result.passwordResetToken).toBe('hashedtoken');
    });
  });

  describe('clearPasswordResetToken', () => {
    it('should clear password reset token and expiry', async () => {
      mockPrisma.user.update.mockResolvedValue({
        ...mockUser,
        passwordResetToken: null,
        passwordResetExpiresAt: null,
      });

      const result = await repository.clearPasswordResetToken(mockObjectId(1));

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: mockObjectId(1) },
        data: {
          passwordResetToken: null,
          passwordResetExpiresAt: null,
        },
      });
      expect(result.passwordResetToken).toBeNull();
      expect(result.passwordResetExpiresAt).toBeNull();
    });
  });

  describe('updatePassword', () => {
    it('should update password hash', async () => {
      mockPrisma.user.update.mockResolvedValue({
        ...mockUser,
        password: 'newhashedpassword',
      });

      const result = await repository.updatePassword(mockObjectId(1), 'newhashedpassword');

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: mockObjectId(1) },
        data: { password: 'newhashedpassword' },
      });
      expect(result.password).toBe('newhashedpassword');
    });
  });

  describe('recordLogin', () => {
    it('should record login with timestamp and ip', async () => {
      mockPrisma.user.update.mockResolvedValue({
        ...mockUser,
        lastLoginAt: expect.any(Date),
        lastLoginIp: '192.168.1.1',
        failedLoginAttempts: 0,
        lockedUntil: null,
      });

      await repository.recordLogin(mockObjectId(1), '192.168.1.1');

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: mockObjectId(1) },
        data: {
          lastLoginAt: expect.any(Date),
          lastLoginIp: '192.168.1.1',
          failedLoginAttempts: 0,
          lockedUntil: null,
        },
      });
    });

    it('should clear failed attempts and lock on successful login', async () => {
      const lockedUser = { ...mockUser, failedLoginAttempts: 5, lockedUntil: new Date() };
      mockPrisma.user.update.mockResolvedValue({
        ...lockedUser,
        failedLoginAttempts: 0,
        lockedUntil: null,
      });

      const result = await repository.recordLogin(mockObjectId(1), '10.0.0.1');

      expect(result.failedLoginAttempts).toBe(0);
      expect(result.lockedUntil).toBeNull();
    });
  });
});
