import type { Request, Response } from 'express';
import type { AdminUser } from '@prisma/client';

import { mapEnum } from '../../../infrastructure/utils/enum-mapper';
import { UnauthorizedError, NotFoundError } from '../../../infrastructure/errors';
import { createLogger } from '../../../infrastructure/logging/logger';
import {
  MAX_LOGIN_ATTEMPTS,
  LOCKOUT_DURATION_MINUTES,
} from '../../../shared/constants/auth.constants';
import type { IAdminAuthService } from '../interfaces/admin-auth-service.interface';
import type { IAdminUserRepository } from '../interfaces/admin-user-repository.interface';
import type { IAuditLogRepository } from '../interfaces/audit-log-repository.interface';
import type { ITokenService } from '../interfaces/token-service.interface';
import type { IPasswordService } from '../interfaces/password-service.interface';
import type { ITwoFactorService } from '../interfaces/two-factor-service.interface';
import type {
  AdminAuthResponse,
  AdminLoginRequest,
  AuthenticatedAdminInfo,
  ChangePasswordRequest,
  TwoFactorSetupResponse,
} from '../types/auth.types';

const logger = createLogger('admin-auth-service');

export class AdminAuthService implements IAdminAuthService {
  constructor(
    private readonly adminRepo: IAdminUserRepository,
    private readonly tokenService: ITokenService,
    private readonly passwordService: IPasswordService,
    private readonly twoFactorService: ITwoFactorService,
    private readonly auditLogRepo: IAuditLogRepository,
  ) {}

  async login(
    data: AdminLoginRequest,
    req: Request,
    res: Response,
  ): Promise<AdminAuthResponse> {
    const admin = await this.adminRepo.findByEmail(data.email);
    if (!admin) {
      throw new UnauthorizedError('Invalid email or password');
    }

    if (admin.lockedUntil && admin.lockedUntil > new Date()) {
      throw new UnauthorizedError('Account is temporarily locked. Try again later.');
    }

    const passwordValid = await this.passwordService.compare(data.password, admin.password);
    if (!passwordValid) {
      const updated = await this.adminRepo.incrementFailedAttempts(admin.id);

      if (updated.failedLoginAttempts >= MAX_LOGIN_ATTEMPTS) {
        const lockedUntil = new Date(Date.now() + LOCKOUT_DURATION_MINUTES * 60 * 1000);
        await this.adminRepo.lockAccount(admin.id, lockedUntil);

        await this.auditLogRepo.create({
          userType: 'ADMIN',
          userId: admin.id,
          action: 'ACCOUNT_LOCKED',
          ipAddress: req.ip ?? req.socket.remoteAddress,
          userAgent: req.headers['user-agent'] as string | undefined,
        });

        logger.warn('Admin account locked', { adminId: admin.id });
      }

      throw new UnauthorizedError('Invalid email or password');
    }

    // If 2FA is enabled, verify the code
    if (admin.twoFactorEnabled) {
      if (!data.twoFactorCode) {
        return {
          user: this.toAdminInfo(admin),
          expiresIn: 0,
          requiresTwoFactor: true,
        };
      }

      if (!admin.twoFactorSecret) {
        throw new UnauthorizedError('Two-factor authentication is misconfigured');
      }

      const codeValid = this.twoFactorService.verifyCode(admin.twoFactorSecret, data.twoFactorCode);
      if (!codeValid) {
        throw new UnauthorizedError('Invalid two-factor code');
      }
    }

    const ip = req.ip ?? req.socket.remoteAddress ?? 'unknown';
    await this.adminRepo.recordLogin(admin.id, ip);

    const permissions = admin.permissions as string[] | null;

    const tokens = await this.tokenService.generateTokenPair(
      {
        sub: admin.id,
        email: admin.email,
        role: admin.role,
        type: 'admin_access',
        permissions: permissions ?? undefined,
      },
      {
        userType: 'ADMIN',
        userId: admin.id,
        ipAddress: ip,
        userAgent: req.headers['user-agent'],
      },
    );

    this.tokenService.setTokenCookies(res, tokens, 'ADMIN');

    await this.auditLogRepo.create({
      userType: 'ADMIN',
      userId: admin.id,
      action: 'LOGIN',
      ipAddress: ip,
      userAgent: req.headers['user-agent'] as string | undefined,
    });

    logger.info('Admin logged in', { adminId: admin.id });

    return {
      user: this.toAdminInfo(admin),
      expiresIn: tokens.expiresIn,
    };
  }

  async refreshToken(req: Request, res: Response): Promise<AdminAuthResponse> {
    const rawToken = req.cookies?.admin_refresh_token as string | undefined;
    if (!rawToken) {
      throw new UnauthorizedError('Refresh token not found');
    }

    const adminId = await this.tokenService.findUserIdByRefreshToken(rawToken);
    if (!adminId) {
      throw new UnauthorizedError('Invalid or expired refresh token');
    }

    const admin = await this.adminRepo.findById(adminId);
    if (!admin) {
      throw new UnauthorizedError('Account not found or inactive');
    }

    const permissions = admin.permissions as string[] | null;

    const tokens = await this.tokenService.rotateRefreshToken(
      rawToken,
      {
        sub: admin.id,
        email: admin.email,
        role: admin.role,
        type: 'admin_access',
        permissions: permissions ?? undefined,
      },
      {
        userType: 'ADMIN',
        userId: admin.id,
        ipAddress: req.ip ?? req.socket.remoteAddress,
        userAgent: req.headers['user-agent'],
      },
    );

    this.tokenService.setTokenCookies(res, tokens, 'ADMIN');

    return {
      user: this.toAdminInfo(admin),
      expiresIn: tokens.expiresIn,
    };
  }

  async logout(_req: Request, res: Response): Promise<void> {
    this.tokenService.clearTokenCookies(res, 'ADMIN');
  }

  async changePassword(adminId: string, data: ChangePasswordRequest): Promise<void> {
    const admin = await this.adminRepo.findById(adminId);
    if (!admin) {
      throw new NotFoundError('Admin');
    }

    const currentValid = await this.passwordService.compare(data.currentPassword, admin.password);
    if (!currentValid) {
      throw new UnauthorizedError('Current password is incorrect');
    }

    const hashedPassword = await this.passwordService.hash(data.newPassword);
    await this.adminRepo.updatePassword(adminId, hashedPassword);

    logger.info('Admin password changed', { adminId });
  }

  async getProfile(adminId: string): Promise<AuthenticatedAdminInfo> {
    const admin = await this.adminRepo.findById(adminId);
    if (!admin) {
      throw new NotFoundError('Admin');
    }
    return this.toAdminInfo(admin);
  }

  async setupTwoFactor(adminId: string): Promise<TwoFactorSetupResponse> {
    const admin = await this.adminRepo.findById(adminId);
    if (!admin) {
      throw new NotFoundError('Admin');
    }

    if (admin.twoFactorEnabled) {
      throw new UnauthorizedError('Two-factor authentication is already enabled');
    }

    const { secret, otpauthUrl } = this.twoFactorService.generateSecret(admin.email);
    await this.adminRepo.setTwoFactorSecret(adminId, secret);

    const qrCodeUrl = await this.twoFactorService.generateQrCode(otpauthUrl);

    logger.info('2FA setup initiated', { adminId });

    return { secret, qrCodeUrl };
  }

  async enableTwoFactor(adminId: string, code: string): Promise<void> {
    const admin = await this.adminRepo.findById(adminId);
    if (!admin || !admin.twoFactorSecret) {
      throw new NotFoundError('Admin or 2FA secret');
    }

    const valid = this.twoFactorService.verifyCode(admin.twoFactorSecret, code);
    if (!valid) {
      throw new UnauthorizedError('Invalid two-factor code');
    }

    await this.adminRepo.enableTwoFactor(adminId);

    await this.auditLogRepo.create({
      userType: 'ADMIN',
      userId: adminId,
      action: 'TWO_FACTOR_ENABLED',
    });

    logger.info('2FA enabled', { adminId });
  }

  async disableTwoFactor(adminId: string, code: string): Promise<void> {
    const admin = await this.adminRepo.findById(adminId);
    if (!admin || !admin.twoFactorSecret) {
      throw new NotFoundError('Admin or 2FA secret');
    }

    const valid = this.twoFactorService.verifyCode(admin.twoFactorSecret, code);
    if (!valid) {
      throw new UnauthorizedError('Invalid two-factor code');
    }

    await this.adminRepo.disableTwoFactor(adminId);

    await this.auditLogRepo.create({
      userType: 'ADMIN',
      userId: adminId,
      action: 'TWO_FACTOR_DISABLED',
    });

    logger.info('2FA disabled', { adminId });
  }

  private toAdminInfo(admin: AdminUser): AuthenticatedAdminInfo {
    return {
      id: admin.id,
      name: admin.name,
      email: admin.email,
      role: mapEnum(admin.role),
      twoFactorEnabled: admin.twoFactorEnabled,
      permissions: admin.permissions as string[] | null,
    };
  }
}
