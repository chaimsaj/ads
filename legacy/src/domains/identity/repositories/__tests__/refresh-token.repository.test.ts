import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { PrismaClient, RefreshToken } from '@prisma/client';

import { mockObjectId } from '../../../../../tests/helpers/objectid-helper';
import { RefreshTokenRepository } from '../refresh-token.repository';
import type { CreateRefreshTokenData } from '../../interfaces/refresh-token-repository.interface';

describe('RefreshTokenRepository', () => {
  let repository: RefreshTokenRepository;
  let mockPrisma: {
    refreshToken: {
      create: ReturnType<typeof vi.fn>;
      findUnique: ReturnType<typeof vi.fn>;
      update: ReturnType<typeof vi.fn>;
      updateMany: ReturnType<typeof vi.fn>;
      deleteMany: ReturnType<typeof vi.fn>;
    };
  };

  const mockRefreshToken: RefreshToken = {
    id: mockObjectId(1),
    userType: 'ADVERTISER',
    userId: mockObjectId(1),
    tokenHash: 'hashedtoken123',
    deviceName: 'Chrome on Windows',
    ipAddress: '192.168.1.1',
    userAgent: 'Mozilla/5.0',
    expiresAt: new Date('2024-01-08T00:00:00Z'),
    revokedAt: null,
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
  };

  beforeEach(() => {
    mockPrisma = {
      refreshToken: {
        create: vi.fn(),
        findUnique: vi.fn(),
        update: vi.fn(),
        updateMany: vi.fn(),
        deleteMany: vi.fn(),
      },
    };

    repository = new RefreshTokenRepository(mockPrisma as unknown as PrismaClient);
  });

  describe('create', () => {
    const createData: CreateRefreshTokenData = {
      userType: 'ADVERTISER',
      userId: mockObjectId(1),
      tokenHash: 'newtokenhash',
      expiresAt: new Date('2024-01-08T00:00:00Z'),
      deviceName: 'Chrome on Mac',
      ipAddress: '10.0.0.1',
      userAgent: 'Mozilla/5.0 Safari',
    };

    it('should create refresh token with all fields', async () => {
      mockPrisma.refreshToken.create.mockResolvedValue({
        ...mockRefreshToken,
        ...createData,
        id: mockObjectId(2),
      });

      const result = await repository.create(createData);

      expect(mockPrisma.refreshToken.create).toHaveBeenCalledWith({
        data: {
          userType: 'ADVERTISER',
          userId: mockObjectId(1),
          tokenHash: 'newtokenhash',
          expiresAt: createData.expiresAt,
          deviceName: 'Chrome on Mac',
          ipAddress: '10.0.0.1',
          userAgent: 'Mozilla/5.0 Safari',
        },
      });
      expect(result.id).toBe(mockObjectId(2));
    });

    it('should create refresh token for admin user type', async () => {
      const adminData: CreateRefreshTokenData = {
        userType: 'ADMIN',
        userId: mockObjectId(5),
        tokenHash: 'admintokenhash',
        expiresAt: new Date('2024-01-08T00:00:00Z'),
      };

      mockPrisma.refreshToken.create.mockResolvedValue({
        ...mockRefreshToken,
        ...adminData,
        userType: 'ADMIN',
        id: mockObjectId(3),
      });

      const result = await repository.create(adminData);

      expect(mockPrisma.refreshToken.create).toHaveBeenCalledWith({
        data: {
          userType: 'ADMIN',
          userId: mockObjectId(5),
          tokenHash: 'admintokenhash',
          expiresAt: adminData.expiresAt,
          deviceName: undefined,
          ipAddress: undefined,
          userAgent: undefined,
        },
      });
      expect(result.userType).toBe('ADMIN');
    });

    it('should create refresh token without optional fields', async () => {
      const minimalData: CreateRefreshTokenData = {
        userType: 'ADVERTISER',
        userId: mockObjectId(1),
        tokenHash: 'minimaltokenhash',
        expiresAt: new Date('2024-01-08T00:00:00Z'),
      };

      mockPrisma.refreshToken.create.mockResolvedValue({
        ...mockRefreshToken,
        ...minimalData,
        deviceName: null,
        ipAddress: null,
        userAgent: null,
        id: mockObjectId(4),
      });

      await repository.create(minimalData);

      expect(mockPrisma.refreshToken.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          deviceName: undefined,
          ipAddress: undefined,
          userAgent: undefined,
        }),
      });
    });
  });

  describe('findByTokenHash', () => {
    it('should find refresh token by hash', async () => {
      mockPrisma.refreshToken.findUnique.mockResolvedValue(mockRefreshToken);

      const result = await repository.findByTokenHash('hashedtoken123');

      expect(mockPrisma.refreshToken.findUnique).toHaveBeenCalledWith({
        where: { tokenHash: 'hashedtoken123' },
      });
      expect(result).toEqual(mockRefreshToken);
    });

    it('should return null when token not found', async () => {
      mockPrisma.refreshToken.findUnique.mockResolvedValue(null);

      const result = await repository.findByTokenHash('nonexistent');

      expect(result).toBeNull();
    });

    it('should find revoked token', async () => {
      const revokedToken = {
        ...mockRefreshToken,
        revokedAt: new Date('2024-01-02T00:00:00Z'),
      };
      mockPrisma.refreshToken.findUnique.mockResolvedValue(revokedToken);

      const result = await repository.findByTokenHash('hashedtoken123');

      expect(result?.revokedAt).not.toBeNull();
    });
  });

  describe('revokeByTokenHash', () => {
    it('should revoke token by setting revokedAt', async () => {
      mockPrisma.refreshToken.update.mockResolvedValue({
        ...mockRefreshToken,
        revokedAt: expect.any(Date),
      });

      await repository.revokeByTokenHash('hashedtoken123');

      expect(mockPrisma.refreshToken.update).toHaveBeenCalledWith({
        where: { tokenHash: 'hashedtoken123' },
        data: { revokedAt: expect.any(Date) },
      });
    });

    it('should return void on successful revocation', async () => {
      mockPrisma.refreshToken.update.mockResolvedValue({
        ...mockRefreshToken,
        revokedAt: new Date(),
      });

      const result = await repository.revokeByTokenHash('hashedtoken123');

      expect(result).toBeUndefined();
    });
  });

  describe('revokeAllForUser', () => {
    it('should revoke all tokens for advertiser user', async () => {
      mockPrisma.refreshToken.updateMany.mockResolvedValue({ count: 5 });

      const result = await repository.revokeAllForUser('ADVERTISER', mockObjectId(1));

      expect(mockPrisma.refreshToken.updateMany).toHaveBeenCalledWith({
        where: {
          userType: 'ADVERTISER',
          userId: mockObjectId(1),
          revokedAt: null,
        },
        data: { revokedAt: expect.any(Date) },
      });
      expect(result).toBe(5);
    });

    it('should revoke all tokens for admin user', async () => {
      mockPrisma.refreshToken.updateMany.mockResolvedValue({ count: 3 });

      const result = await repository.revokeAllForUser('ADMIN', mockObjectId(5));

      expect(mockPrisma.refreshToken.updateMany).toHaveBeenCalledWith({
        where: {
          userType: 'ADMIN',
          userId: mockObjectId(5),
          revokedAt: null,
        },
        data: { revokedAt: expect.any(Date) },
      });
      expect(result).toBe(3);
    });

    it('should return 0 when no tokens to revoke', async () => {
      mockPrisma.refreshToken.updateMany.mockResolvedValue({ count: 0 });

      const result = await repository.revokeAllForUser('ADVERTISER', mockObjectId(999));

      expect(result).toBe(0);
    });

    it('should only revoke non-revoked tokens', async () => {
      mockPrisma.refreshToken.updateMany.mockResolvedValue({ count: 2 });

      await repository.revokeAllForUser('ADVERTISER', mockObjectId(1));

      expect(mockPrisma.refreshToken.updateMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          revokedAt: null,
        }),
        data: expect.any(Object),
      });
    });
  });

  describe('deleteExpired', () => {
    it('should delete expired tokens', async () => {
      mockPrisma.refreshToken.deleteMany.mockResolvedValue({ count: 10 });

      const result = await repository.deleteExpired();

      expect(mockPrisma.refreshToken.deleteMany).toHaveBeenCalledWith({
        where: {
          expiresAt: { lt: expect.any(Date) },
        },
      });
      expect(result).toBe(10);
    });

    it('should return 0 when no expired tokens', async () => {
      mockPrisma.refreshToken.deleteMany.mockResolvedValue({ count: 0 });

      const result = await repository.deleteExpired();

      expect(result).toBe(0);
    });

    it('should delete tokens expired before current time', async () => {
      mockPrisma.refreshToken.deleteMany.mockResolvedValue({ count: 5 });

      await repository.deleteExpired();

      const call = mockPrisma.refreshToken.deleteMany.mock.calls[0][0];
      const expiresAtCondition = call.where.expiresAt.lt;

      // The date should be close to now (within 1 second)
      expect(expiresAtCondition.getTime()).toBeCloseTo(Date.now(), -3);
    });
  });
});
