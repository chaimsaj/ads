import type { Request, Response, NextFunction } from 'express';

import { UnauthorizedError } from '../../../infrastructure/errors';
import type { ITokenService } from '../interfaces/token-service.interface';

export function createAuthenticate(tokenService: ITokenService) {
  return function authenticate(req: Request, _res: Response, next: NextFunction): void {
    const token = extractToken(req, 'access_token');
    if (!token) {
      next(createUnauthorized());
      return;
    }

    try {
      req.user = tokenService.verifyAccessToken(token);
      next();
    } catch {
      next(createUnauthorized());
    }
  };
}

export function createAdminAuthenticate(tokenService: ITokenService) {
  return function adminAuthenticate(req: Request, _res: Response, next: NextFunction): void {
    const token = extractToken(req, 'admin_access_token');
    if (!token) {
      next(createUnauthorized());
      return;
    }

    try {
      const payload = tokenService.verifyAccessToken(token);
      if (payload.type !== 'admin_access') {
        next(createUnauthorized());
        return;
      }
      req.user = payload;
      next();
    } catch {
      next(createUnauthorized());
    }
  };
}

function extractToken(req: Request, cookieName: string): string | undefined {
  // 1. Check httpOnly cookie
  const cookieToken = req.cookies?.[cookieName] as string | undefined;
  if (cookieToken) return cookieToken;

  // 2. Fallback to Authorization header (for API clients)
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }

  return undefined;
}

function createUnauthorized() {
  return new UnauthorizedError('Authentication required');
}
