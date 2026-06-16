import { describe, it, expect, vi, beforeEach } from 'vitest';
import jwt from 'jsonwebtoken';

import type { IRefreshTokenRepository } from '../../interfaces/refresh-token-repository.interface';
import type { AccessTokenPayload, RefreshTokenMeta } from '../../types/auth.types';
import { TokenService } from '../token.service';
import { mockObjectId } from '../../../../../tests/helpers/objectid-helper';

function createMockRefreshTokenRepo(): IRefreshTokenRepository {
  return {
    create: vi.fn().mockResolvedValue({
      id: mockObjectId(1),
      tokenHash: 'mock-hash',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    }),
    findByTokenHash: vi.fn().mockResolvedValue(null),
    revokeByTokenHash: vi.fn().mockResolvedValue(undefined),
    revokeAllForUser: vi.fn().mockResolvedValue(0),
    deleteExpired: vi.fn().mockResolvedValue(0),
  };
}

const mockPayload: AccessTokenPayload = {
  sub: mockObjectId(1),
  email: 'user@example.com',
  role: 'ADVERTISER',
  type: 'access',
};

const mockMeta: RefreshTokenMeta = {
  userType: 'USER',
  userId: mockObjectId(1),
  ipAddress: '127.0.0.1',
  userAgent: 'test-agent',
};

describe('TokenService', () => {
  let service: TokenService;
  let mockRepo: IRefreshTokenRepository;

  beforeEach(() => {
    mockRepo = createMockRefreshTokenRepo();
    service = new TokenService(mockRepo);
  });

  describe('generateTokenPair', () => {
    it('should generate access and refresh tokens', async () => {
      const result = await service.generateTokenPair(mockPayload, mockMeta);

      expect(result.accessToken).toBeTruthy();
      expect(result.refreshToken).toBeTruthy();
      expect(result.expiresIn).toBeGreaterThan(0);
    });

    it('should store refresh token hash in repository', async () => {
      await service.generateTokenPair(mockPayload, mockMeta);

      expect(mockRepo.create).toHaveBeenCalledTimes(1);
      expect(mockRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userType: 'USER',
          userId: mockObjectId(1),
          tokenHash: expect.any(String),
          expiresAt: expect.any(Date),
        }),
      );
    });

    it('should produce a valid JWT access token', async () => {
      const result = await service.generateTokenPair(mockPayload, mockMeta);
      const secret = process.env.JWT_ACCESS_SECRET!;
      const decoded = jwt.verify(result.accessToken, secret) as Record<string, unknown>;

      expect(decoded.sub).toBe(mockObjectId(1));
      expect(decoded.email).toBe('user@example.com');
      expect(decoded.role).toBe('ADVERTISER');
      expect(decoded.type).toBe('access');
    });
  });

  describe('verifyAccessToken', () => {
    it('should return payload for a valid token', async () => {
      const { accessToken } = await service.generateTokenPair(mockPayload, mockMeta);
      const result = service.verifyAccessToken(accessToken);

      expect(result.sub).toBe(mockObjectId(1));
      expect(result.email).toBe('user@example.com');
    });

    it('should throw UnauthorizedError for an invalid token', () => {
      expect(() => service.verifyAccessToken('invalid-token')).toThrow('Invalid or expired access token');
    });

    it('should throw UnauthorizedError for an expired token', () => {
      const secret = process.env.JWT_ACCESS_SECRET!;
      const token = jwt.sign(mockPayload, secret, { expiresIn: '0s' });

      expect(() => service.verifyAccessToken(token)).toThrow('Invalid or expired access token');
    });
  });

  describe('rotateRefreshToken', () => {
    it('should throw when token is not found', async () => {
      vi.mocked(mockRepo.findByTokenHash).mockResolvedValue(null);

      await expect(
        service.rotateRefreshToken('old-token', mockPayload, mockMeta),
      ).rejects.toThrow('Invalid refresh token');
    });

    it('should throw when token is revoked', async () => {
      vi.mocked(mockRepo.findByTokenHash).mockResolvedValue({
        id: mockObjectId(1),
        userType: 'USER',
        userId: mockObjectId(1),
        tokenHash: 'hash',
        expiresAt: new Date(Date.now() + 86400000),
        revokedAt: new Date(),
        deviceName: null,
        ipAddress: null,
        userAgent: null,
        createdAt: new Date(),
      });

      await expect(
        service.rotateRefreshToken('old-token', mockPayload, mockMeta),
      ).rejects.toThrow('Invalid refresh token');
    });

    it('should revoke old token and generate new pair on valid token', async () => {
      vi.mocked(mockRepo.findByTokenHash).mockResolvedValue({
        id: mockObjectId(1),
        userType: 'USER',
        userId: mockObjectId(1),
        tokenHash: 'hash',
        expiresAt: new Date(Date.now() + 86400000),
        revokedAt: null,
        deviceName: null,
        ipAddress: null,
        userAgent: null,
        createdAt: new Date(),
      });

      const result = await service.rotateRefreshToken('valid-token', mockPayload, mockMeta);

      expect(mockRepo.revokeByTokenHash).toHaveBeenCalledTimes(1);
      expect(result.accessToken).toBeTruthy();
      expect(result.refreshToken).toBeTruthy();
    });
  });

  describe('revokeAllUserTokens', () => {
    it('should call revokeAllForUser on repository', async () => {
      await service.revokeAllUserTokens('USER', mockObjectId(1));
      expect(mockRepo.revokeAllForUser).toHaveBeenCalledWith('USER', mockObjectId(1));
    });
  });
});
