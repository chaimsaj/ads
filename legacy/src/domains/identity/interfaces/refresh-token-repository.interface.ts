import type { RefreshToken, TokenUserType } from '@prisma/client';

export interface IRefreshTokenRepository {
  create(data: CreateRefreshTokenData): Promise<RefreshToken>;
  findByTokenHash(tokenHash: string): Promise<RefreshToken | null>;
  revokeByTokenHash(tokenHash: string): Promise<void>;
  revokeAllForUser(userType: TokenUserType, userId: string): Promise<number>;
  deleteExpired(): Promise<number>;
}

export interface CreateRefreshTokenData {
  readonly userType: TokenUserType;
  readonly userId: string;
  readonly tokenHash: string;
  readonly expiresAt: Date;
  readonly deviceName?: string;
  readonly ipAddress?: string;
  readonly userAgent?: string;
}
