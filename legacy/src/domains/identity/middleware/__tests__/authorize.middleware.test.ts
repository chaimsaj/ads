import { describe, it, expect, vi } from 'vitest';
import type { Request, Response, NextFunction } from 'express';

import { mockObjectId } from '../../../../../tests/helpers/objectid-helper';
import { authorize, requirePermission } from '../authorize.middleware';

function createMockReqResNext(user?: Request['user']) {
  const req = { user } as Request;
  const res = {} as Response;
  const next = vi.fn() as NextFunction;
  return { req, res, next };
}

describe('authorize middleware', () => {
  it('should call next when user has an allowed role', () => {
    const middleware = authorize('ADMIN', 'SUPER_ADMIN');
    const { req, res, next } = createMockReqResNext({
      sub: mockObjectId(1),
      email: 'admin@example.com',
      role: 'ADMIN',
      type: 'admin_access',
    });

    middleware(req, res, next);

    expect(next).toHaveBeenCalledWith();
  });

  it('should call next with ForbiddenError when role is not allowed', () => {
    const middleware = authorize('SUPER_ADMIN');
    const { req, res, next } = createMockReqResNext({
      sub: mockObjectId(1),
      email: 'admin@example.com',
      role: 'ADMIN',
      type: 'admin_access',
    });

    middleware(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 403 }));
  });

  it('should call next with ForbiddenError when user is not set', () => {
    const middleware = authorize('ADMIN');
    const { req, res, next } = createMockReqResNext(undefined);

    middleware(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 403 }));
  });
});

describe('requirePermission middleware', () => {
  it('should call next when user has required permissions', () => {
    const middleware = requirePermission('campaigns.read', 'campaigns.write');
    const { req, res, next } = createMockReqResNext({
      sub: mockObjectId(1),
      email: 'admin@example.com',
      role: 'ADMIN',
      type: 'admin_access',
      permissions: ['campaigns.read', 'campaigns.write', 'users.read'],
    });

    middleware(req, res, next);

    expect(next).toHaveBeenCalledWith();
  });

  it('should call next with ForbiddenError when missing permissions', () => {
    const middleware = requirePermission('campaigns.delete');
    const { req, res, next } = createMockReqResNext({
      sub: mockObjectId(1),
      email: 'admin@example.com',
      role: 'ADMIN',
      type: 'admin_access',
      permissions: ['campaigns.read'],
    });

    middleware(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 403 }));
  });

  it('should call next with ForbiddenError when no user', () => {
    const middleware = requirePermission('anything');
    const { req, res, next } = createMockReqResNext(undefined);

    middleware(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 403 }));
  });
});
