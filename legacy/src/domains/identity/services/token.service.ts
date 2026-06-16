import jwt from 'jsonwebtoken';
import type { StringValue } from 'ms';
import type { Response } from 'express';
import type { TokenUserType } from '@prisma/client';

import { getEnv } from '../../../config/environment';
import { CryptoService } from '../../../infrastructure/auth/crypto.service';
import { UnauthorizedError } from '../../../infrastructure/errors';
import type { IRefreshTokenRepository } from '../interfaces/refresh-token-repository.interface';
import type { ITokenService } from '../interfaces/token-service.interface';
import type { AccessTokenPayload, RefreshTokenMeta, TokenPair } from '../types/auth.types';

const ACCESS_COOKIE = 'access_token';
const REFRESH_COOKIE = 'refresh_token';
const ADMIN_ACCESS_COOKIE = 'admin_access_token';
const ADMIN_REFRESH_COOKIE = 'admin_refresh_token';

export class TokenService implements ITokenService {
  private readonly crypto = new CryptoService();

  constructor(private readonly refreshTokenRepo: IRefreshTokenRepository) {}

  async generateTokenPair(
    payload: AccessTokenPayload,
    meta: RefreshTokenMeta,
  ): Promise<TokenPair> {
    const env = getEnv();

    const accessToken = jwt.sign(
      { ...payload },
      env.JWT_ACCESS_SECRET,
      { expiresIn: env.JWT_ACCESS_EXPIRES_IN as StringValue },
    );

    const rawRefreshToken = this.crypto.generateRefreshToken();
    const tokenHash = this.crypto.hashToken(rawRefreshToken);

    const expiresAt = this.parseExpiry(env.JWT_REFRESH_EXPIRES_IN);

    await this.refreshTokenRepo.create({
      userType: meta.userType,
      userId: meta.userId,
      tokenHash,
      expiresAt,
      deviceName: meta.deviceName,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });

    return {
      accessToken,
      refreshToken: rawRefreshToken,
      expiresIn: this.parseExpirySeconds(env.JWT_ACCESS_EXPIRES_IN),
    };
  }

  verifyAccessToken(token: string): AccessTokenPayload {
    const env = getEnv();
    try {
      const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET);
      return decoded as unknown as AccessTokenPayload;
    } catch {
      throw new UnauthorizedError('Invalid or expired access token');
    }
  }

  async rotateRefreshToken(
    oldRawToken: string,
    payload: AccessTokenPayload,
    meta: RefreshTokenMeta,
  ): Promise<TokenPair> {
    const oldTokenHash = this.crypto.hashToken(oldRawToken);

    const existing = await this.refreshTokenRepo.findByTokenHash(oldTokenHash);

    if (!existing || existing.revokedAt || existing.expiresAt < new Date()) {
      if (existing && !existing.revokedAt) {
        await this.refreshTokenRepo.revokeAllForUser(meta.userType, meta.userId);
      }
      throw new UnauthorizedError('Invalid refresh token');
    }

    await this.refreshTokenRepo.revokeByTokenHash(oldTokenHash);

    return this.generateTokenPair(payload, meta);
  }

  async findUserIdByRefreshToken(rawToken: string): Promise<string | null> {
    const tokenHash = this.crypto.hashToken(rawToken);
    const stored = await this.refreshTokenRepo.findByTokenHash(tokenHash);
    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
      return null;
    }
    return stored.userId;
  }

  async revokeRefreshToken(tokenHash: string): Promise<void> {
    await this.refreshTokenRepo.revokeByTokenHash(tokenHash);
  }

  async revokeAllUserTokens(userType: TokenUserType, userId: string): Promise<void> {
    await this.refreshTokenRepo.revokeAllForUser(userType, userId);
  }

  setTokenCookies(res: Response, tokens: TokenPair, userType: TokenUserType): void {
    const env = getEnv();
    const isProduction = env.NODE_ENV === 'production';
    const accessName = userType === 'USER' ? ACCESS_COOKIE : ADMIN_ACCESS_COOKIE;
    const refreshName = userType === 'USER' ? REFRESH_COOKIE : ADMIN_REFRESH_COOKIE;

    const baseOptions = {
      httpOnly: true,
      secure: env.COOKIE_SECURE || isProduction,
      sameSite: 'none' as const,
    };

    res.cookie(accessName, tokens.accessToken, {
      ...baseOptions,
      maxAge: tokens.expiresIn * 1000,
      path: '/',
    });

    res.cookie(refreshName, tokens.refreshToken, {
      ...baseOptions,
      maxAge: this.parseExpirySeconds(env.JWT_REFRESH_EXPIRES_IN) * 1000,
      path: '/',
    });
  }

  clearTokenCookies(res: Response, userType: TokenUserType): void {
    const env = getEnv();
    const isProduction = env.NODE_ENV === 'production';
    const accessName = userType === 'USER' ? ACCESS_COOKIE : ADMIN_ACCESS_COOKIE;
    const refreshName = userType === 'USER' ? REFRESH_COOKIE : ADMIN_REFRESH_COOKIE;

    const baseOptions = {
      httpOnly: true,
      secure: env.COOKIE_SECURE || isProduction,
      sameSite: 'none' as const,
    };

    res.clearCookie(accessName, { ...baseOptions, path: '/' });
    res.clearCookie(refreshName, {
      ...baseOptions,
      path: '/',
    });
  }

  private parseExpiry(expiry: string): Date {
    const seconds = this.parseExpirySeconds(expiry);
    return new Date(Date.now() + seconds * 1000);
  }

  private parseExpirySeconds(expiry: string): number {
    const match = expiry.match(/^(\d+)([smhd])$/);
    if (!match) return 900;

    const value = parseInt(match[1], 10);
    const unit = match[2];

    const multipliers: Record<string, number> = {
      s: 1,
      m: 60,
      h: 3600,
      d: 86400,
    };

    return value * (multipliers[unit] ?? 60);
  }
}
