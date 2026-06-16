import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { AdminUser, AdminRole, AdminStatus } from '@prisma/client';

import type { IAdminUserRepository } from '../../interfaces/admin-user-repository.interface';
import type { IAuditLogRepository } from '../../interfaces/audit-log-repository.interface';
import type { ITokenService } from '../../interfaces/token-service.interface';
import type { IPasswordService } from '../../interfaces/password-service.interface';
import type { ITwoFactorService } from '../../interfaces/two-factor-service.interface';
import { AdminAuthService } from '../admin-auth.service';
import { mockObjectId } from '../../../../../tests/helpers/objectid-helper';

function createMockAdmin(overrides: Partial<AdminUser> = {}): AdminUser {
  return {
    id: mockObjectId(1),
    name: 'Test Admin',
    email: 'admin@example.com',
    password: '$2b$12$hashedpassword',
    role: 'ADMIN' as AdminRole,
    permissions: null,
    twoFactorSecret: null,
    twoFactorEnabled: false,
    failedLoginAttempts: 0,
    lockedUntil: null,
    lastLoginAt: null,
    lastLoginIp: null,
    status: 'ACTIVE' as AdminStatus,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: null,
    ...overrides,
  };
}

function createMockAdminRepo(): IAdminUserRepository {
  return {
    findById: vi.fn().mockResolvedValue(null),
    findByEmail: vi.fn().mockResolvedValue(null),
    incrementFailedAttempts: vi.fn().mockResolvedValue(createMockAdmin({ failedLoginAttempts: 1 })),
    resetFailedAttempts: vi.fn(),
    lockAccount: vi.fn(),
    recordLogin: vi.fn(),
    updatePassword: vi.fn(),
    setTwoFactorSecret: vi.fn(),
    enableTwoFactor: vi.fn(),
    disableTwoFactor: vi.fn(),
  };
}

function createMockTokenService(): ITokenService {
  return {
    generateTokenPair: vi.fn().mockResolvedValue({
      accessToken: 'mock-access',
      refreshToken: 'mock-refresh',
      expiresIn: 900,
    }),
    verifyAccessToken: vi.fn(),
    rotateRefreshToken: vi.fn(),
    revokeRefreshToken: vi.fn(),
    revokeAllUserTokens: vi.fn(),
    setTokenCookies: vi.fn(),
    clearTokenCookies: vi.fn(),
  };
}

function createMockPasswordService(): IPasswordService {
  return {
    hash: vi.fn().mockResolvedValue('$2b$12$newhash'),
    compare: vi.fn().mockResolvedValue(true),
  };
}

function createMockTwoFactorService(): ITwoFactorService {
  return {
    generateSecret: vi.fn().mockReturnValue({
      secret: 'TOTP_SECRET',
      otpauthUrl: 'otpauth://totp/MynglyAds:admin@example.com?secret=TOTP_SECRET',
    }),
    generateQrCode: vi.fn().mockResolvedValue('data:image/png;base64,abc'),
    verifyCode: vi.fn().mockReturnValue(true),
  };
}

function createMockAuditLogRepo(): IAuditLogRepository {
  return {
    create: vi.fn().mockResolvedValue(undefined),
  };
}

function createMockReqRes() {
  const req = {
    ip: '127.0.0.1',
    socket: { remoteAddress: '127.0.0.1' },
    headers: { 'user-agent': 'test-agent' },
    cookies: {},
    user: { sub: mockObjectId(1), email: 'admin@example.com', role: 'ADMIN', type: 'admin_access' as const },
  } as unknown as import('express').Request;

  const res = {
    cookie: vi.fn(),
    clearCookie: vi.fn(),
  } as unknown as import('express').Response;

  return { req, res };
}

describe('AdminAuthService', () => {
  let service: AdminAuthService;
  let adminRepo: IAdminUserRepository;
  let tokenService: ITokenService;
  let passwordService: IPasswordService;
  let twoFactorService: ITwoFactorService;
  let auditLogRepo: IAuditLogRepository;

  beforeEach(() => {
    adminRepo = createMockAdminRepo();
    tokenService = createMockTokenService();
    passwordService = createMockPasswordService();
    twoFactorService = createMockTwoFactorService();
    auditLogRepo = createMockAuditLogRepo();
    service = new AdminAuthService(
      adminRepo,
      tokenService,
      passwordService,
      twoFactorService,
      auditLogRepo,
    );
  });

  describe('login', () => {
    it('should login admin without 2FA and set cookies', async () => {
      vi.mocked(adminRepo.findByEmail).mockResolvedValue(createMockAdmin());
      const { req, res } = createMockReqRes();

      const result = await service.login(
        { email: 'admin@example.com', password: 'pass' },
        req,
        res,
      );

      expect(adminRepo.recordLogin).toHaveBeenCalledWith(mockObjectId(1), expect.any(String));
      expect(tokenService.generateTokenPair).toHaveBeenCalledTimes(1);
      expect(tokenService.setTokenCookies).toHaveBeenCalledTimes(1);
      expect(auditLogRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'LOGIN' }),
      );
      expect(result.user.id).toBe(mockObjectId(1));
      expect(result.requiresTwoFactor).toBeUndefined();
    });

    it('should require 2FA code when enabled but not provided', async () => {
      vi.mocked(adminRepo.findByEmail).mockResolvedValue(
        createMockAdmin({ twoFactorEnabled: true, twoFactorSecret: 'SECRET' }),
      );
      const { req, res } = createMockReqRes();

      const result = await service.login(
        { email: 'admin@example.com', password: 'pass' },
        req,
        res,
      );

      expect(result.requiresTwoFactor).toBe(true);
      expect(tokenService.generateTokenPair).not.toHaveBeenCalled();
    });

    it('should login with valid 2FA code', async () => {
      vi.mocked(adminRepo.findByEmail).mockResolvedValue(
        createMockAdmin({ twoFactorEnabled: true, twoFactorSecret: 'SECRET' }),
      );
      const { req, res } = createMockReqRes();

      const result = await service.login(
        { email: 'admin@example.com', password: 'pass', twoFactorCode: '123456' },
        req,
        res,
      );

      expect(twoFactorService.verifyCode).toHaveBeenCalledWith('SECRET', '123456');
      expect(result.requiresTwoFactor).toBeUndefined();
      expect(tokenService.generateTokenPair).toHaveBeenCalledTimes(1);
    });

    it('should throw for invalid 2FA code', async () => {
      vi.mocked(adminRepo.findByEmail).mockResolvedValue(
        createMockAdmin({ twoFactorEnabled: true, twoFactorSecret: 'SECRET' }),
      );
      vi.mocked(twoFactorService.verifyCode).mockReturnValue(false);
      const { req, res } = createMockReqRes();

      await expect(
        service.login(
          { email: 'admin@example.com', password: 'pass', twoFactorCode: '000000' },
          req,
          res,
        ),
      ).rejects.toThrow('Invalid two-factor code');
    });

    it('should throw UnauthorizedError for wrong password', async () => {
      vi.mocked(adminRepo.findByEmail).mockResolvedValue(createMockAdmin());
      vi.mocked(passwordService.compare).mockResolvedValue(false);
      const { req, res } = createMockReqRes();

      await expect(
        service.login({ email: 'admin@example.com', password: 'wrong' }, req, res),
      ).rejects.toThrow('Invalid email or password');

      expect(adminRepo.incrementFailedAttempts).toHaveBeenCalledWith(mockObjectId(1));
    });

    it('should lock admin account after max failed attempts', async () => {
      vi.mocked(adminRepo.findByEmail).mockResolvedValue(createMockAdmin());
      vi.mocked(passwordService.compare).mockResolvedValue(false);
      vi.mocked(adminRepo.incrementFailedAttempts).mockResolvedValue(
        createMockAdmin({ failedLoginAttempts: 5 }),
      );
      const { req, res } = createMockReqRes();

      await expect(
        service.login({ email: 'admin@example.com', password: 'wrong' }, req, res),
      ).rejects.toThrow('Invalid email or password');

      expect(adminRepo.lockAccount).toHaveBeenCalledWith(mockObjectId(1), expect.any(Date));
      expect(auditLogRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'ACCOUNT_LOCKED' }),
      );
    });

    it('should throw when account is locked', async () => {
      vi.mocked(adminRepo.findByEmail).mockResolvedValue(
        createMockAdmin({ lockedUntil: new Date(Date.now() + 60000) }),
      );
      const { req, res } = createMockReqRes();

      await expect(
        service.login({ email: 'admin@example.com', password: 'pass' }, req, res),
      ).rejects.toThrow('Account is temporarily locked');
    });
  });

  describe('changePassword', () => {
    it('should update password when current is correct', async () => {
      vi.mocked(adminRepo.findById).mockResolvedValue(createMockAdmin());

      await service.changePassword(mockObjectId(1), {
        currentPassword: 'OldPass1!',
        newPassword: 'NewPass1!',
      });

      expect(passwordService.hash).toHaveBeenCalledWith('NewPass1!');
      expect(adminRepo.updatePassword).toHaveBeenCalledWith(mockObjectId(1), expect.any(String));
    });

    it('should throw when current password is wrong', async () => {
      vi.mocked(adminRepo.findById).mockResolvedValue(createMockAdmin());
      vi.mocked(passwordService.compare).mockResolvedValue(false);

      await expect(
        service.changePassword(mockObjectId(1), { currentPassword: 'Wrong!', newPassword: 'New1!' }),
      ).rejects.toThrow('Current password is incorrect');
    });
  });

  describe('getProfile', () => {
    it('should return admin info', async () => {
      vi.mocked(adminRepo.findById).mockResolvedValue(createMockAdmin());

      const profile = await service.getProfile(mockObjectId(1));

      expect(profile.id).toBe(mockObjectId(1));
      expect(profile.email).toBe('admin@example.com');
      expect(profile.twoFactorEnabled).toBe(false);
    });

    it('should throw NotFoundError when admin not found', async () => {
      await expect(service.getProfile(mockObjectId(999))).rejects.toThrow('not found');
    });
  });

  describe('setupTwoFactor', () => {
    it('should generate secret and QR code', async () => {
      vi.mocked(adminRepo.findById).mockResolvedValue(createMockAdmin());

      const result = await service.setupTwoFactor(mockObjectId(1));

      expect(result.secret).toBe('TOTP_SECRET');
      expect(result.qrCodeUrl).toBe('data:image/png;base64,abc');
      expect(adminRepo.setTwoFactorSecret).toHaveBeenCalledWith(mockObjectId(1), 'TOTP_SECRET');
    });

    it('should throw when 2FA is already enabled', async () => {
      vi.mocked(adminRepo.findById).mockResolvedValue(
        createMockAdmin({ twoFactorEnabled: true }),
      );

      await expect(service.setupTwoFactor(mockObjectId(1))).rejects.toThrow(
        'Two-factor authentication is already enabled',
      );
    });
  });

  describe('enableTwoFactor', () => {
    it('should enable 2FA with valid code', async () => {
      vi.mocked(adminRepo.findById).mockResolvedValue(
        createMockAdmin({ twoFactorSecret: 'SECRET' }),
      );

      await service.enableTwoFactor(mockObjectId(1), '123456');

      expect(twoFactorService.verifyCode).toHaveBeenCalledWith('SECRET', '123456');
      expect(adminRepo.enableTwoFactor).toHaveBeenCalledWith(mockObjectId(1));
      expect(auditLogRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'TWO_FACTOR_ENABLED' }),
      );
    });

    it('should throw for invalid 2FA code during enable', async () => {
      vi.mocked(adminRepo.findById).mockResolvedValue(
        createMockAdmin({ twoFactorSecret: 'SECRET' }),
      );
      vi.mocked(twoFactorService.verifyCode).mockReturnValue(false);

      await expect(service.enableTwoFactor(mockObjectId(1), '000000')).rejects.toThrow(
        'Invalid two-factor code',
      );
    });
  });

  describe('disableTwoFactor', () => {
    it('should disable 2FA with valid code', async () => {
      vi.mocked(adminRepo.findById).mockResolvedValue(
        createMockAdmin({ twoFactorEnabled: true, twoFactorSecret: 'SECRET' }),
      );

      await service.disableTwoFactor(mockObjectId(1), '123456');

      expect(adminRepo.disableTwoFactor).toHaveBeenCalledWith(mockObjectId(1));
      expect(auditLogRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'TWO_FACTOR_DISABLED' }),
      );
    });
  });

  describe('logout', () => {
    it('should clear admin token cookies', async () => {
      const { req, res } = createMockReqRes();

      await service.logout(req, res);

      expect(tokenService.clearTokenCookies).toHaveBeenCalledWith(res, 'ADMIN');
    });
  });
});
