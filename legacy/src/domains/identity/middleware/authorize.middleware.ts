import type { Request, Response, NextFunction } from 'express';

import { ForbiddenError } from '../../../infrastructure/errors';

export function authorize(...allowedRoles: readonly string[]) {
  return function authorizeMiddleware(req: Request, _res: Response, next: NextFunction): void {
    if (!req.user) {
      next(new ForbiddenError());
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      next(new ForbiddenError('Insufficient role privileges'));
      return;
    }

    next();
  };
}

export function requirePermission(...permissions: readonly string[]) {
  return function permissionMiddleware(req: Request, _res: Response, next: NextFunction): void {
    if (!req.user) {
      next(new ForbiddenError());
      return;
    }

    const userPermissions = req.user.permissions ?? [];
    const hasAll = permissions.every((p) => userPermissions.includes(p));

    if (!hasAll) {
      next(new ForbiddenError('Insufficient permissions'));
      return;
    }

    next();
  };
}
