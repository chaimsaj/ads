import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { User, UserStatus, UserRole } from '@prisma/client';

import type { IUserRepository } from '../../interfaces/user-repository.interface';
import type { ITokenService } from '../../interfaces/token-service.interface';
import type { IPasswordService } from '../../interfaces/password-service.interface';
import { AuthService } from '../auth.service';
import { mockObjectId } from '../../../../../tests/helpers/objectid-helper';

function createMockUser(overrides: Partial<User> = {}): User {
  return {
    id: mockObjectId(1),
    name: 'Test User',
    email: 'test@example.com',
    password: '$2b$12$hashedpassword',
    phone: null,
    company: null,
    avatar: null,
    emailVerifiedAt: null,
    verificationCode: '123456',
    verificationCodeExpiresAt: new Date(Date.now() + 30 * 60 * 1000),
    passwordResetToken: null,
    passwordResetExpiresAt: null,
    status: 'ACTIVE' as UserStatus,
    role: 'ADVERTISER' as UserRole,
    failedLoginAttempts: 0,
    lockedUntil: null,
    lastLoginAt: null,
    lastLoginIp: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    ...overrides,
  };
}

function createMockUserRepo(): IUserRepository {
  return {
    findById: vi.fn().mockResolvedValue(null),
    findByEmail: vi.fn().mockResolvedValue(null),
    create: vi.fn().mockImplementation((data) =>
      Promise.resolve(createMockUser({ name: data.name, email: data.email })),
    ),
    update: vi.fn(),
    incrementFailedAttempts: vi.fn().mockImplementation(() =>
      Promise.resolve(createMockUser({ failedLoginAttempts: 1 })),
    ),
    resetFailedAttempts: vi.fn(),
    lockAccount: vi.fn(),
    setVerificationCode: vi.fn(),
    verifyEmail: vi.fn(),
    setPasswordResetToken: vi.fn(),
    clearPasswordResetToken: vi.fn(),
    updatePassword: vi.fn(),
    recordLogin: vi.fn(),
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

function createMockReqRes() {
  const req = {
    ip: '127.0.0.1',
    socket: { remoteAddress: '127.0.0.1' },
    headers: { 'user-agent': 'test-agent' },
    cookies: {},
    user: { sub: mockObjectId(1), email: 'test@example.com', role: 'ADVERTISER', type: 'access' as const },
  } as unknown as import('express').Request;

  const res = {
    cookie: vi.fn(),
    clearCookie: vi.fn(),
  } as unknown as import('express').Response;

  return { req, res };
}

describe('AuthService', () => {
  let service: AuthService;
  let userRepo: IUserRepository;
  let tokenService: ITokenService;
  let passwordService: IPasswordService;

  beforeEach(() => {
    userRepo = createMockUserRepo();
    tokenService = createMockTokenService();
    passwordService = createMockPasswordService();
    service = new AuthService(userRepo, tokenService, passwordService);
  });

  describe('register', () => {
    it('should create a new user and return auth response', async () => {
      const result = await service.register({
        name: 'New User',
        email: 'new@example.com',
        password: 'StrongPass1!',
      });

      expect(userRepo.findByEmail).toHaveBeenCalledWith('new@example.com');
      expect(passwordService.hash).toHaveBeenCalledWith('StrongPass1!');
      expect(userRepo.create).toHaveBeenCalledTimes(1);
      expect(result.user.name).toBe('New User');
      expect(result.user.email).toBe('new@example.com');
    });

    it('should throw ConflictError when email already exists', async () => {
      vi.mocked(userRepo.findByEmail).mockResolvedValue(createMockUser());

      await expect(
        service.register({
          name: 'Dupe User',
          email: 'test@example.com',
          password: 'StrongPass1!',
        }),
      ).rejects.toThrow('Email already registered');
    });
  });

  describe('login', () => {
    it('should login and set cookies on valid credentials', async () => {
      const mockUser = createMockUser();
      vi.mocked(userRepo.findByEmail).mockResolvedValue(mockUser);
      const { req, res } = createMockReqRes();

      const result = await service.login({ email: 'test@example.com', password: 'pass' }, req, res);

      expect(userRepo.recordLogin).toHaveBeenCalledWith(mockObjectId(1), expect.any(String));
      expect(tokenService.generateTokenPair).toHaveBeenCalledTimes(1);
      expect(tokenService.setTokenCookies).toHaveBeenCalledTimes(1);
      expect(result.user.id).toBe(mockObjectId(1));
      expect(result.expiresIn).toBe(900);
    });

    it('should throw UnauthorizedError when user not found', async () => {
      const { req, res } = createMockReqRes();

      await expect(
        service.login({ email: 'nobody@example.com', password: 'pass' }, req, res),
      ).rejects.toThrow('Invalid email or password');
    });

    it('should throw UnauthorizedError when password is wrong', async () => {
      vi.mocked(userRepo.findByEmail).mockResolvedValue(createMockUser());
      vi.mocked(passwordService.compare).mockResolvedValue(false);
      const { req, res } = createMockReqRes();

      await expect(
        service.login({ email: 'test@example.com', password: 'wrong' }, req, res),
      ).rejects.toThrow('Invalid email or password');

      expect(userRepo.incrementFailedAttempts).toHaveBeenCalledWith(mockObjectId(1));
    });

    it('should lock account after max failed attempts', async () => {
      vi.mocked(userRepo.findByEmail).mockResolvedValue(createMockUser());
      vi.mocked(passwordService.compare).mockResolvedValue(false);
      vi.mocked(userRepo.incrementFailedAttempts).mockResolvedValue(
        createMockUser({ failedLoginAttempts: 5 }),
      );
      const { req, res } = createMockReqRes();

      await expect(
        service.login({ email: 'test@example.com', password: 'wrong' }, req, res),
      ).rejects.toThrow('Invalid email or password');

      expect(userRepo.lockAccount).toHaveBeenCalledWith(mockObjectId(1), expect.any(Date));
    });

    it('should throw UnauthorizedError when account is locked', async () => {
      const lockedUser = createMockUser({ lockedUntil: new Date(Date.now() + 60000) });
      vi.mocked(userRepo.findByEmail).mockResolvedValue(lockedUser);
      const { req, res } = createMockReqRes();

      await expect(
        service.login({ email: 'test@example.com', password: 'pass' }, req, res),
      ).rejects.toThrow('Account is temporarily locked');
    });

    it('should throw UnauthorizedError when account is suspended', async () => {
      vi.mocked(userRepo.findByEmail).mockResolvedValue(
        createMockUser({ status: 'SUSPENDED' as UserStatus }),
      );
      const { req, res } = createMockReqRes();

      await expect(
        service.login({ email: 'test@example.com', password: 'pass' }, req, res),
      ).rejects.toThrow('Account is suspended');
    });
  });

  describe('verifyEmail', () => {
    it('should verify email with valid code', async () => {
      vi.mocked(userRepo.findByEmail).mockResolvedValue(createMockUser());

      await service.verifyEmail({ email: 'test@example.com', code: '123456' });

      expect(userRepo.verifyEmail).toHaveBeenCalledWith(mockObjectId(1));
    });

    it('should throw NotFoundError when user not found', async () => {
      await expect(
        service.verifyEmail({ email: 'nobody@test.com', code: '123456' }),
      ).rejects.toThrow('not found');
    });

    it('should skip if already verified', async () => {
      vi.mocked(userRepo.findByEmail).mockResolvedValue(
        createMockUser({ emailVerifiedAt: new Date() }),
      );

      await service.verifyEmail({ email: 'test@example.com', code: '123456' });

      expect(userRepo.verifyEmail).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedError for wrong code', async () => {
      vi.mocked(userRepo.findByEmail).mockResolvedValue(createMockUser());

      await expect(
        service.verifyEmail({ email: 'test@example.com', code: '000000' }),
      ).rejects.toThrow('Invalid or expired verification code');
    });

    it('should throw UnauthorizedError for expired code', async () => {
      vi.mocked(userRepo.findByEmail).mockResolvedValue(
        createMockUser({ verificationCodeExpiresAt: new Date(Date.now() - 1000) }),
      );

      await expect(
        service.verifyEmail({ email: 'test@example.com', code: '123456' }),
      ).rejects.toThrow('Invalid or expired verification code');
    });
  });

  describe('forgotPassword', () => {
    it('should set password reset token when user exists', async () => {
      vi.mocked(userRepo.findByEmail).mockResolvedValue(createMockUser());

      await service.forgotPassword({ email: 'test@example.com' });

      expect(userRepo.setPasswordResetToken).toHaveBeenCalledWith(
        mockObjectId(1),
        expect.any(String),
        expect.any(Date),
      );
    });

    it('should not throw when user does not exist (prevent enumeration)', async () => {
      await expect(
        service.forgotPassword({ email: 'nobody@test.com' }),
      ).resolves.toBeUndefined();
    });
  });

  describe('changePassword', () => {
    it('should update password when current password is correct', async () => {
      vi.mocked(userRepo.findById).mockResolvedValue(createMockUser());

      await service.changePassword(mockObjectId(1), {
        currentPassword: 'OldPass1!',
        newPassword: 'NewPass1!',
      });

      expect(passwordService.compare).toHaveBeenCalledWith('OldPass1!', expect.any(String));
      expect(passwordService.hash).toHaveBeenCalledWith('NewPass1!');
      expect(userRepo.updatePassword).toHaveBeenCalledWith(mockObjectId(1), expect.any(String));
    });

    it('should throw when current password is wrong', async () => {
      vi.mocked(userRepo.findById).mockResolvedValue(createMockUser());
      vi.mocked(passwordService.compare).mockResolvedValue(false);

      await expect(
        service.changePassword(mockObjectId(1), {
          currentPassword: 'Wrong!',
          newPassword: 'NewPass1!',
        }),
      ).rejects.toThrow('Current password is incorrect');
    });

    it('should throw NotFoundError when user not found', async () => {
      await expect(
        service.changePassword(mockObjectId(999), {
          currentPassword: 'Old!',
          newPassword: 'New1!',
        }),
      ).rejects.toThrow('not found');
    });
  });

  describe('logout', () => {
    it('should clear token cookies', async () => {
      const { req, res } = createMockReqRes();

      await service.logout(req, res);

      expect(tokenService.clearTokenCookies).toHaveBeenCalledWith(res, 'USER');
    });
  });

  describe('logoutAll', () => {
    it('should revoke all tokens and clear cookies', async () => {
      const { res } = createMockReqRes();

      await service.logoutAll(mockObjectId(1), res);

      expect(tokenService.revokeAllUserTokens).toHaveBeenCalledWith('USER', mockObjectId(1));
      expect(tokenService.clearTokenCookies).toHaveBeenCalledWith(res, 'USER');
    });
  });
});
