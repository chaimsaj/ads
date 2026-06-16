import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { PrismaClient, AdminUser } from '@prisma/client';

import { mockObjectId } from '../../../../../tests/helpers/objectid-helper';
import { AdminUserRepository } from '../admin-user.repository';

describe('AdminUserRepository', () => {
  let repository: AdminUserRepository;
  let mockPrisma: {
    adminUser: {
      findFirst: ReturnType<typeof vi.fn>;
      update: ReturnType<typeof vi.fn>;
    };
  };

  const mockAdminUser: AdminUser = {
    id: mockObjectId(1),
    name: 'Admin User',
    email: 'admin@example.com',
    password: 'hashedpassword',
    role: 'admin',
    permissions: ['users:read', 'users:write'],
    status: 'ACTIVE',
    twoFactorEnabled: false,
    twoFactorSecret: null,
    failedLoginAttempts: 0,
    lockedUntil: null,
    lastLoginAt: null,
    lastLoginIp: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    mockPrisma = {
      adminUser: {
        findFirst: vi.fn(),
        update: vi.fn(),
      },
    };

    repository = new AdminUserRepository(mockPrisma as unknown as PrismaClient);
  });

  describe('findById', () => {
    it('should find admin user by id with active status', async () => {
      mockPrisma.adminUser.findFirst.mockResolvedValue(mockAdminUser);

      const result = await repository.findById(mockObjectId(1));

      expect(mockPrisma.adminUser.findFirst).toHaveBeenCalledWith({
        where: { id: mockObjectId(1), status: 'ACTIVE' },
      });
      expect(result).toEqual(mockAdminUser);
    });

    it('should return null when admin not found', async () => {
      mockPrisma.adminUser.findFirst.mockResolvedValue(null);

      const result = await repository.findById(mockObjectId(999));

      expect(result).toBeNull();
    });

    it('should return null for inactive admin', async () => {
      mockPrisma.adminUser.findFirst.mockResolvedValue(null);

      const result = await repository.findById(mockObjectId(1));

      expect(mockPrisma.adminUser.findFirst).toHaveBeenCalledWith({
        where: { id: mockObjectId(1), status: 'ACTIVE' },
      });
      expect(result).toBeNull();
    });
  });

  describe('findByEmail', () => {
    it('should find admin user by email with active status', async () => {
      mockPrisma.adminUser.findFirst.mockResolvedValue(mockAdminUser);

      const result = await repository.findByEmail('admin@example.com');

      expect(mockPrisma.adminUser.findFirst).toHaveBeenCalledWith({
        where: { email: 'admin@example.com', status: 'ACTIVE' },
      });
      expect(result).toEqual(mockAdminUser);
    });

    it('should return null when email not found', async () => {
      mockPrisma.adminUser.findFirst.mockResolvedValue(null);

      const result = await repository.findByEmail('notfound@example.com');

      expect(result).toBeNull();
    });

    it('should handle email lookup correctly', async () => {
      mockPrisma.adminUser.findFirst.mockResolvedValue(null);

      await repository.findByEmail('Admin@Example.com');

      expect(mockPrisma.adminUser.findFirst).toHaveBeenCalledWith({
        where: { email: 'Admin@Example.com', status: 'ACTIVE' },
      });
    });
  });

  describe('incrementFailedAttempts', () => {
    it('should increment failed login attempts', async () => {
      mockPrisma.adminUser.update.mockResolvedValue({
        ...mockAdminUser,
        failedLoginAttempts: 1,
      });

      const result = await repository.incrementFailedAttempts(mockObjectId(1));

      expect(mockPrisma.adminUser.update).toHaveBeenCalledWith({
        where: { id: mockObjectId(1) },
        data: { failedLoginAttempts: { increment: 1 } },
      });
      expect(result.failedLoginAttempts).toBe(1);
    });

    it('should work for multiple increments', async () => {
      mockPrisma.adminUser.update.mockResolvedValue({
        ...mockAdminUser,
        failedLoginAttempts: 5,
      });

      const result = await repository.incrementFailedAttempts(mockObjectId(1));

      expect(result.failedLoginAttempts).toBe(5);
    });
  });

  describe('resetFailedAttempts', () => {
    it('should reset failed attempts and clear lock', async () => {
      mockPrisma.adminUser.update.mockResolvedValue({
        ...mockAdminUser,
        failedLoginAttempts: 0,
        lockedUntil: null,
      });

      const result = await repository.resetFailedAttempts(mockObjectId(1));

      expect(mockPrisma.adminUser.update).toHaveBeenCalledWith({
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
      mockPrisma.adminUser.update.mockResolvedValue({
        ...mockAdminUser,
        lockedUntil: lockDate,
      });

      const result = await repository.lockAccount(mockObjectId(1), lockDate);

      expect(mockPrisma.adminUser.update).toHaveBeenCalledWith({
        where: { id: mockObjectId(1) },
        data: { lockedUntil: lockDate },
      });
      expect(result.lockedUntil).toEqual(lockDate);
    });

    it('should lock for future date', async () => {
      const futureDate = new Date(Date.now() + 3600000); // 1 hour from now
      mockPrisma.adminUser.update.mockResolvedValue({
        ...mockAdminUser,
        lockedUntil: futureDate,
      });

      const result = await repository.lockAccount(mockObjectId(1), futureDate);

      expect(result.lockedUntil).toEqual(futureDate);
    });
  });

  describe('recordLogin', () => {
    it('should record login with timestamp and ip', async () => {
      mockPrisma.adminUser.update.mockResolvedValue({
        ...mockAdminUser,
        lastLoginAt: expect.any(Date),
        lastLoginIp: '192.168.1.1',
        failedLoginAttempts: 0,
        lockedUntil: null,
      });

      await repository.recordLogin(mockObjectId(1), '192.168.1.1');

      expect(mockPrisma.adminUser.update).toHaveBeenCalledWith({
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
      const lockedAdmin = {
        ...mockAdminUser,
        failedLoginAttempts: 5,
        lockedUntil: new Date(),
      };
      mockPrisma.adminUser.update.mockResolvedValue({
        ...lockedAdmin,
        failedLoginAttempts: 0,
        lockedUntil: null,
      });

      const result = await repository.recordLogin(mockObjectId(1), '10.0.0.1');

      expect(result.failedLoginAttempts).toBe(0);
      expect(result.lockedUntil).toBeNull();
    });

    it('should handle IPv6 addresses', async () => {
      mockPrisma.adminUser.update.mockResolvedValue({
        ...mockAdminUser,
        lastLoginIp: '2001:db8::1',
      });

      await repository.recordLogin(mockObjectId(1), '2001:db8::1');

      expect(mockPrisma.adminUser.update).toHaveBeenCalledWith({
        where: { id: mockObjectId(1) },
        data: expect.objectContaining({
          lastLoginIp: '2001:db8::1',
        }),
      });
    });
  });

  describe('updatePassword', () => {
    it('should update password hash', async () => {
      mockPrisma.adminUser.update.mockResolvedValue({
        ...mockAdminUser,
        password: 'newhashedpassword',
      });

      const result = await repository.updatePassword(mockObjectId(1), 'newhashedpassword');

      expect(mockPrisma.adminUser.update).toHaveBeenCalledWith({
        where: { id: mockObjectId(1) },
        data: { password: 'newhashedpassword' },
      });
      expect(result.password).toBe('newhashedpassword');
    });
  });

  describe('setTwoFactorSecret', () => {
    it('should set two factor secret', async () => {
      mockPrisma.adminUser.update.mockResolvedValue({
        ...mockAdminUser,
        twoFactorSecret: 'JBSWY3DPEHPK3PXP',
      });

      const result = await repository.setTwoFactorSecret(mockObjectId(1), 'JBSWY3DPEHPK3PXP');

      expect(mockPrisma.adminUser.update).toHaveBeenCalledWith({
        where: { id: mockObjectId(1) },
        data: { twoFactorSecret: 'JBSWY3DPEHPK3PXP' },
      });
      expect(result.twoFactorSecret).toBe('JBSWY3DPEHPK3PXP');
    });
  });

  describe('enableTwoFactor', () => {
    it('should enable two factor authentication', async () => {
      mockPrisma.adminUser.update.mockResolvedValue({
        ...mockAdminUser,
        twoFactorEnabled: true,
      });

      const result = await repository.enableTwoFactor(mockObjectId(1));

      expect(mockPrisma.adminUser.update).toHaveBeenCalledWith({
        where: { id: mockObjectId(1) },
        data: { twoFactorEnabled: true },
      });
      expect(result.twoFactorEnabled).toBe(true);
    });
  });

  describe('disableTwoFactor', () => {
    it('should disable two factor and clear secret', async () => {
      mockPrisma.adminUser.update.mockResolvedValue({
        ...mockAdminUser,
        twoFactorEnabled: false,
        twoFactorSecret: null,
      });

      const result = await repository.disableTwoFactor(mockObjectId(1));

      expect(mockPrisma.adminUser.update).toHaveBeenCalledWith({
        where: { id: mockObjectId(1) },
        data: {
          twoFactorEnabled: false,
          twoFactorSecret: null,
        },
      });
      expect(result.twoFactorEnabled).toBe(false);
      expect(result.twoFactorSecret).toBeNull();
    });
  });
});
