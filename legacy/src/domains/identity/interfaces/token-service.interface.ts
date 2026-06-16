import type { Response } from 'express';
import type { TokenUserType } from '@prisma/client';

import type { AccessTokenPayload, TokenPair, RefreshTokenMeta } from '../types/auth.types';

export interface ITokenService {
  generateTokenPair(
    payload: AccessTokenPayload,
    meta: RefreshTokenMeta,
  ): Promise<TokenPair>;

  verifyAccessToken(token: string): AccessTokenPayload;

  rotateRefreshToken(
    oldTokenHash: string,
    payload: AccessTokenPayload,
    meta: RefreshTokenMeta,
  ): Promise<TokenPair>;

  findUserIdByRefreshToken(rawToken: string): Promise<string | null>;

  revokeRefreshToken(tokenHash: string): Promise<void>;

  revokeAllUserTokens(userType: TokenUserType, userId: string): Promise<void>;

  setTokenCookies(res: Response, tokens: TokenPair, userType: TokenUserType): void;

  clearTokenCookies(res: Response, userType: TokenUserType): void;
}
