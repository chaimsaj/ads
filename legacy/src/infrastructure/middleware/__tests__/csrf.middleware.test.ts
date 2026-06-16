import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request, Response, NextFunction } from 'express';

import { csrfProtection } from '../csrf.middleware';

function createMockReqResNext(options: {
  method?: string;
  path?: string;
  cookies?: Record<string, string>;
  headers?: Record<string, string>;
} = {}) {
  const req = {
    method: options.method ?? 'GET',
    path: options.path ?? '/test',
    cookies: options.cookies ?? {},
    headers: options.headers ?? {},
  } as unknown as Request;

  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
    cookie: vi.fn().mockReturnThis(),
  } as unknown as Response;

  const next = vi.fn() as NextFunction;

  return { req, res, next };
}

describe('csrfProtection middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('safe methods (GET, HEAD, OPTIONS)', () => {
    it('should set csrf_token cookie on GET when no existing cookie', () => {
      const { req, res, next } = createMockReqResNext({ method: 'GET' });

      csrfProtection(req, res, next);

      expect(res.cookie).toHaveBeenCalledWith(
        'csrf_token',
        expect.any(String),
        expect.objectContaining({
          httpOnly: false,
          sameSite: 'strict',
        }),
      );
      expect(next).toHaveBeenCalled();
    });

    it('should not reset existing csrf_token cookie on GET', () => {
      const { req, res, next } = createMockReqResNext({
        method: 'GET',
        cookies: { csrf_token: 'existing-token' },
      });

      csrfProtection(req, res, next);

      expect(res.cookie).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalled();
    });

    it('should call next for HEAD requests', () => {
      const { req, res, next } = createMockReqResNext({ method: 'HEAD' });

      csrfProtection(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should call next for OPTIONS requests', () => {
      const { req, res, next } = createMockReqResNext({ method: 'OPTIONS' });

      csrfProtection(req, res, next);

      expect(next).toHaveBeenCalled();
    });
  });

  describe('unsafe methods (POST, PUT, DELETE, PATCH)', () => {
    it('should return 403 CSRF_INVALID when POST without cookie', () => {
      const { req, res, next } = createMockReqResNext({
        method: 'POST',
        headers: { 'x-csrf-token': 'header-token' },
      });

      csrfProtection(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          code: 'CSRF_INVALID',
        }),
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 403 CSRF_INVALID when POST without header', () => {
      const { req, res, next } = createMockReqResNext({
        method: 'POST',
        cookies: { csrf_token: 'cookie-token' },
      });

      csrfProtection(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          code: 'CSRF_INVALID',
        }),
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 403 CSRF_INVALID when tokens mismatch', () => {
      const { req, res, next } = createMockReqResNext({
        method: 'POST',
        cookies: { csrf_token: 'cookie-token' },
        headers: { 'x-csrf-token': 'different-header-token' },
      });

      csrfProtection(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          code: 'CSRF_INVALID',
        }),
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('should call next when tokens match', () => {
      const token = 'valid-matching-token';
      const { req, res, next } = createMockReqResNext({
        method: 'POST',
        cookies: { csrf_token: token },
        headers: { 'x-csrf-token': token },
      });

      csrfProtection(req, res, next);

      expect(res.status).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalled();
    });

    it('should validate PUT requests', () => {
      const token = 'valid-token';
      const { req, res, next } = createMockReqResNext({
        method: 'PUT',
        cookies: { csrf_token: token },
        headers: { 'x-csrf-token': token },
      });

      csrfProtection(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should validate DELETE requests', () => {
      const { req, res, next } = createMockReqResNext({
        method: 'DELETE',
        cookies: {},
        headers: {},
      });

      csrfProtection(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
    });
  });

  describe('webhook bypass', () => {
    it('should bypass CSRF for paths containing /webhook', () => {
      const { req, res, next } = createMockReqResNext({
        method: 'POST',
        path: '/api/v1/stripe/webhooks',
        cookies: {},
        headers: {},
      });

      csrfProtection(req, res, next);

      expect(res.status).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalled();
    });

    it('should bypass CSRF for webhook subpaths', () => {
      const { req, res, next } = createMockReqResNext({
        method: 'POST',
        path: '/webhook/test',
        cookies: {},
        headers: {},
      });

      csrfProtection(req, res, next);

      expect(next).toHaveBeenCalled();
    });
  });
});
