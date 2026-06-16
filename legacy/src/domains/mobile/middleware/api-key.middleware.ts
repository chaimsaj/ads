import type { Request, Response, NextFunction } from 'express';

import { getEnv } from '../../../config/environment';
import { UnauthorizedError } from '../../../infrastructure/errors/unauthorized.error';

export function apiKeyAuth(req: Request, _res: Response, next: NextFunction): void {
  const apiKey = req.header('x-api-key');
  const expectedKey = getEnv().MOBILE_API_KEY;

  if (!expectedKey || apiKey !== expectedKey) {
    next(new UnauthorizedError('Invalid or missing API key'));
    return;
  }

  next();
}
