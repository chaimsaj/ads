import type { Request, Response } from 'express';

import { mapEnum } from '../../../infrastructure/utils/enum-mapper';
import { CryptoService } from '../../../infrastructure/auth/crypto.service';
import { ConflictError, UnauthorizedError, NotFoundError } from '../../../infrastructure/errors';
import { createLogger } from '../../../infrastructure/logging/logger';
import {
  MAX_LOGIN_ATTEMPTS,
  LOCKOUT_DURATION_MINUTES,
  VERIFICATION_CODE_EXPIRY_MINUTES,
  PASSWORD_RESET_EXPIRY_MINUTES,
} from '../../../shared/constants/auth.constants';
import type { IAuthService } from '../interfaces/auth-service.interface';
import type { IUserRepository } from '../interfaces/user-repository.interface';
import type { ITokenService } from '../interfaces/token-service.interface';
import type { IPasswordService } from '../interfaces/password-service.interface';
import type {
  AuthResponse,
  ChangePasswordRequest,
  ForgotPasswordRequest,
  LoginRequest,
  RegisterRequest,
  ResetPasswordRequest,
  VerifyEmailRequest,
  AuthenticatedUserInfo,
} from '../types/auth.types';

const logger = createLogger('auth-service');

export class AuthService implements IAuthService {
  private readonly crypto = new CryptoService();

  constructor(
    private readonly userRepo: IUserRepository,
    private readonly tokenService: ITokenService,
    private readonly passwordService: IPasswordService,
  ) {
  }

  async register(data: RegisterRequest): Promise<AuthResponse> {
    const existing = await this.userRepo.findByEmail(data.email);
    if (existing) {
      throw new ConflictError('Email already registered');
    }

    const hashedPassword = await this.passwordService.hash(data.password);
    const verificationCode = '123456';
    const verificationCodeExpiresAt = new Date(
      Date.now() + VERIFICATION_CODE_EXPIRY_MINUTES * 60 * 1000,
    );

    const user = await this.userRepo.create({
      name: data.name,
      email: data.email,
      password: hashedPassword,
      phone: data.phone,
      company: data.company,
      verificationCode,
      verificationCodeExpiresAt,
    });

    logger.info('User registered', { userId: user.id, email: user.email });

    // TODO: Send verification email via notification domain (Stage 4)
    // TODO: Restore random code generation: this.crypto.generateVerificationCode()

    return {
      user: this.toUserInfo(user),
      expiresIn: 0,
    };
  }

  async login(data: LoginRequest, req: Request, res: Response): Promise<AuthResponse> {
    const user = await this.userRepo.findByEmail(data.email);
    if (!user) {
      throw new UnauthorizedError('Invalid account');
    }

    if (user.status !== 'ACTIVE') {
      throw new UnauthorizedError('Account is suspended');
    }

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw new UnauthorizedError('Account is temporarily locked. Try again later.');
    }

    const passwordValid = await this.passwordService.compare(data.password, user.password);
    if (!passwordValid) {
      const updated = await this.userRepo.incrementFailedAttempts(user.id);

      if (updated.failedLoginAttempts >= MAX_LOGIN_ATTEMPTS) {
        const lockedUntil = new Date(Date.now() + LOCKOUT_DURATION_MINUTES * 60 * 1000);
        await this.userRepo.lockAccount(user.id, lockedUntil);
        logger.warn('Account locked after failed attempts', { userId: user.id });
      }

      throw new UnauthorizedError('Invalid email or password');
    }

    const ip = req.ip ?? req.socket.remoteAddress ?? 'unknown';
    await this.userRepo.recordLogin(user.id, ip);

    const tokens = await this.tokenService.generateTokenPair(
      {
        sub: user.id,
        email: user.email,
        role: user.role,
        type: 'access',
      },
      {
        userType: 'USER',
        userId: user.id,
        ipAddress: ip,
        userAgent: req.headers['user-agent'],
      },
    );

    this.tokenService.setTokenCookies(res, tokens, 'USER');

    logger.info('User logged in', { userId: user.id });

    return {
      user: this.toUserInfo(user),
      expiresIn: tokens.expiresIn,
    };
  }

  async verifyEmail(data: VerifyEmailRequest): Promise<void> {
    const user = await this.userRepo.findByEmail(data.email);
    if (!user) {
      throw new NotFoundError('User');
    }

    if (user.emailVerifiedAt) {
      return;
    }

    if (
      !user.verificationCode ||
      !user.verificationCodeExpiresAt ||
      user.verificationCode !== data.code ||
      user.verificationCodeExpiresAt < new Date()
    ) {
      throw new UnauthorizedError('Invalid or expired verification code');
    }

    await this.userRepo.verifyEmail(user.id);
    logger.info('Email verified', { userId: user.id });
  }

  async forgotPassword(data: ForgotPasswordRequest): Promise<void> {
    const user = await this.userRepo.findByEmail(data.email);
    if (!user) {
      // Return silently to prevent email enumeration
      return;
    }

    const rawToken = this.crypto.generateResetToken();
    const tokenHash = this.crypto.hashToken(rawToken);
    const expiresAt = new Date(Date.now() + PASSWORD_RESET_EXPIRY_MINUTES * 60 * 1000);

    await this.userRepo.setPasswordResetToken(user.id, tokenHash, expiresAt);

    logger.info('Password reset requested', { userId: user.id });

    // TODO: Send password reset email via notification domain (Stage 4)
    // The email should contain the raw token (not the hash)
  }

  async resetPassword(_data: ResetPasswordRequest): Promise<void> {
    // TODO: Implement when findByPasswordResetToken is added to the repository.
    // The flow: hash the raw token, find user by hashed token, verify expiry,
    // update password, clear reset token.
    throw new NotFoundError('Not implemented — requires findByPasswordResetToken in repository');
  }

  async changePassword(userId: string, data: ChangePasswordRequest): Promise<void> {
    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new NotFoundError('User');
    }

    const currentValid = await this.passwordService.compare(data.currentPassword, user.password);
    if (!currentValid) {
      throw new UnauthorizedError('Current password is incorrect');
    }

    const hashedPassword = await this.passwordService.hash(data.newPassword);
    await this.userRepo.updatePassword(userId, hashedPassword);

    logger.info('Password changed', { userId });
  }

  async refreshToken(req: Request, res: Response): Promise<AuthResponse> {
    const rawToken = req.cookies?.refresh_token as string | undefined;
    if (!rawToken) {
      throw new UnauthorizedError('Refresh token not found');
    }

    const userId = await this.tokenService.findUserIdByRefreshToken(rawToken);
    if (!userId) {
      throw new UnauthorizedError('Invalid or expired refresh token');
    }

    const foundUser = await this.userRepo.findById(userId);
    if (!foundUser || foundUser.status !== 'ACTIVE') {
      throw new UnauthorizedError('Account not found or inactive');
    }

    const tokens = await this.tokenService.rotateRefreshToken(
      rawToken,
      {
        sub: foundUser.id,
        email: foundUser.email,
        role: foundUser.role,
        type: 'access',
      },
      {
        userType: 'USER',
        userId: foundUser.id,
        ipAddress: req.ip ?? req.socket.remoteAddress,
        userAgent: req.headers['user-agent'],
      },
    );

    this.tokenService.setTokenCookies(res, tokens, 'USER');

    return {
      user: this.toUserInfo(foundUser),
      expiresIn: tokens.expiresIn,
    };
  }

  async logout(_req: Request, res: Response): Promise<void> {
    this.tokenService.clearTokenCookies(res, 'USER');
  }

  async logoutAll(userId: string, res: Response): Promise<void> {
    await this.tokenService.revokeAllUserTokens('USER', userId);
    this.tokenService.clearTokenCookies(res, 'USER');
    logger.info('All sessions revoked', { userId });
  }

  private toUserInfo(user: {
    id: string;
    name: string;
    email: string;
    role: string;
    emailVerifiedAt: Date | null;
  }): AuthenticatedUserInfo {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: mapEnum(user.role),
      emailVerified: user.emailVerifiedAt !== null,
    };
  }
}
