import crypto from 'node:crypto';

import type { Request, Response, NextFunction } from 'express';

import { getEnv } from '../../config/environment';

const CSRF_COOKIE = 'csrf_token';
const CSRF_HEADER = 'x-csrf-token';

export function csrfProtection(req: Request, res: Response, next: NextFunction): void {
  const env = getEnv();
  const isProduction = env.NODE_ENV === 'production';

  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    const existing = req.cookies?.[CSRF_COOKIE] as string | undefined;
    if (!existing) {
      const token = crypto.randomBytes(32).toString('hex');
      res.cookie(CSRF_COOKIE, token, {
        httpOnly: false,
        secure: env.COOKIE_SECURE || isProduction,
        sameSite: 'none',
        maxAge: 24 * 60 * 60 * 1000,
      });
      res.setHeader('X-CSRF-Token', token);
    } else {
      res.setHeader('X-CSRF-Token', existing);
    }
    next();
    return;
  }

  if (req.path.includes('/webhook') || req.path.endsWith('/auth/refresh') || req.path.includes('/v1/tracking')) {
    next();
    return;
  }

  const cookieToken = req.cookies?.[CSRF_COOKIE] as string | undefined;
  const headerToken = req.headers[CSRF_HEADER] as string | undefined;

  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    res.status(403).json({
      success: false,
      error: 'Invalid CSRF token',
      code: 'CSRF_INVALID',
    });
    return;
  }

  next();
}
