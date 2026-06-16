import type { RefreshToken, PrismaClient, TokenUserType } from '@prisma/client';

import type {
  IRefreshTokenRepository,
  CreateRefreshTokenData,
} from '../interfaces/refresh-token-repository.interface';

export class RefreshTokenRepository implements IRefreshTokenRepository {
  constructor(private readonly db: PrismaClient) {}

  async create(data: CreateRefreshTokenData): Promise<RefreshToken> {
    return this.db.refreshToken.create({
      data: {
        userType: data.userType,
        userId: data.userId,
        tokenHash: data.tokenHash,
        expiresAt: data.expiresAt,
        deviceName: data.deviceName,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
      },
    });
  }

  async findByTokenHash(tokenHash: string): Promise<RefreshToken | null> {
    return this.db.refreshToken.findUnique({
      where: { tokenHash },
    });
  }

  async revokeByTokenHash(tokenHash: string): Promise<void> {
    await this.db.refreshToken.update({
      where: { tokenHash },
      data: { revokedAt: new Date() },
    });
  }

  async revokeAllForUser(userType: TokenUserType, userId: string): Promise<number> {
    const result = await this.db.refreshToken.updateMany({
      where: {
        userType,
        userId,
        revokedAt: null,
      },
      data: { revokedAt: new Date() },
    });
    return result.count;
  }

  async deleteExpired(): Promise<number> {
    const result = await this.db.refreshToken.deleteMany({
      where: {
        expiresAt: { lt: new Date() },
      },
    });
    return result.count;
  }
}
