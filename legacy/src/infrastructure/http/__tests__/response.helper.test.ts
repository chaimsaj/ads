import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Response, Request } from 'express';

import { success, created, noContent, error, paginated } from '../response.helper';
import type { PaginationMeta } from '../../../shared/types/api-response.types';

// Mock factory for Express Response
function createMockResponse(): Response {
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
    send: vi.fn().mockReturnThis(),
    req: {
      requestId: 'test-request-id-123',
    } as unknown as Request,
  } as unknown as Response;
  return res;
}

describe('response.helper', () => {
  let mockRes: Response;

  beforeEach(() => {
    mockRes = createMockResponse();
  });

  describe('success', () => {
    it('should return 200 status code by default', () => {
      const data = { id: 1, name: 'Test' };

      success(mockRes, data);

      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it('should return JSON response with success true', () => {
      const data = { id: 1, name: 'Test' };

      success(mockRes, data);

      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: { id: 1, name: 'Test' },
        message: undefined,
        requestId: 'test-request-id-123',
      });
    });

    it('should include message when provided', () => {
      const data = { id: 1 };
      const message = 'Operation successful';

      success(mockRes, data, message);

      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: { id: 1 },
        message: 'Operation successful',
        requestId: 'test-request-id-123',
      });
    });

    it('should allow custom status code', () => {
      const data = { id: 1 };

      success(mockRes, data, undefined, 202);

      expect(mockRes.status).toHaveBeenCalledWith(202);
    });

    it('should handle null data', () => {
      success(mockRes, null);

      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: null,
        message: undefined,
        requestId: 'test-request-id-123',
      });
    });

    it('should handle undefined data', () => {
      success(mockRes, undefined);

      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: undefined,
        message: undefined,
        requestId: 'test-request-id-123',
      });
    });

    it('should handle array data', () => {
      const data = [{ id: 1 }, { id: 2 }];

      success(mockRes, data);

      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: [{ id: 1 }, { id: 2 }],
        message: undefined,
        requestId: 'test-request-id-123',
      });
    });

    it('should handle empty array', () => {
      success(mockRes, []);

      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: [],
        message: undefined,
        requestId: 'test-request-id-123',
      });
    });

    it('should handle primitive data types', () => {
      success(mockRes, 'string value');

      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: 'string value',
        message: undefined,
        requestId: 'test-request-id-123',
      });
    });

    it('should handle numeric data', () => {
      success(mockRes, 42);

      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: 42,
        message: undefined,
        requestId: 'test-request-id-123',
      });
    });

    it('should handle boolean data', () => {
      success(mockRes, true);

      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: true,
        message: undefined,
        requestId: 'test-request-id-123',
      });
    });

    it('should handle nested object data', () => {
      const data = {
        user: {
          id: 1,
          profile: {
            name: 'Test',
            settings: { theme: 'dark' },
          },
        },
      };

      success(mockRes, data);

      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data,
        message: undefined,
        requestId: 'test-request-id-123',
      });
    });

    it('should handle empty message string', () => {
      success(mockRes, { id: 1 }, '');

      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: { id: 1 },
        message: '',
        requestId: 'test-request-id-123',
      });
    });
  });

  describe('created', () => {
    it('should return 201 status code', () => {
      const data = { id: 1 };

      created(mockRes, data);

      expect(mockRes.status).toHaveBeenCalledWith(201);
    });

    it('should return JSON response with success true', () => {
      const data = { id: 1, name: 'New Resource' };

      created(mockRes, data);

      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: { id: 1, name: 'New Resource' },
        message: undefined,
        requestId: 'test-request-id-123',
      });
    });

    it('should include message when provided', () => {
      const data = { id: 1 };
      const message = 'Resource created successfully';

      created(mockRes, data, message);

      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: { id: 1 },
        message: 'Resource created successfully',
        requestId: 'test-request-id-123',
      });
    });

    it('should handle null data', () => {
      created(mockRes, null, 'Created');

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: null,
        message: 'Created',
        requestId: 'test-request-id-123',
      });
    });

    it('should handle complex object data', () => {
      const data = {
        id: 'uuid-123',
        createdAt: '2024-01-01T00:00:00Z',
        metadata: { source: 'api' },
      };

      created(mockRes, data);

      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data,
        message: undefined,
        requestId: 'test-request-id-123',
      });
    });
  });

  describe('noContent', () => {
    it('should return 204 status code', () => {
      noContent(mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(204);
    });

    it('should call send without body', () => {
      noContent(mockRes);

      expect(mockRes.send).toHaveBeenCalled();
    });

    it('should not call json method', () => {
      noContent(mockRes);

      expect(mockRes.json).not.toHaveBeenCalled();
    });

    it('should chain status and send correctly', () => {
      noContent(mockRes);

      // Verify both were called
      expect(mockRes.status).toHaveBeenCalled();
      expect(mockRes.send).toHaveBeenCalled();
    });
  });

  describe('error', () => {
    it('should return specified status code', () => {
      error(mockRes, 400, 'Bad Request');

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it('should return JSON response with success false', () => {
      error(mockRes, 400, 'Invalid input');

      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid input',
        code: undefined,
        requestId: 'test-request-id-123',
      });
    });

    it('should include error code when provided', () => {
      error(mockRes, 400, 'Invalid email', 'INVALID_EMAIL');

      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid email',
        code: 'INVALID_EMAIL',
        requestId: 'test-request-id-123',
      });
    });

    it('should handle 401 Unauthorized', () => {
      error(mockRes, 401, 'Authentication required', 'UNAUTHORIZED');

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Authentication required',
        code: 'UNAUTHORIZED',
        requestId: 'test-request-id-123',
      });
    });

    it('should handle 403 Forbidden', () => {
      error(mockRes, 403, 'Access denied', 'FORBIDDEN');

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Access denied',
        code: 'FORBIDDEN',
        requestId: 'test-request-id-123',
      });
    });

    it('should handle 404 Not Found', () => {
      error(mockRes, 404, 'Resource not found', 'NOT_FOUND');

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Resource not found',
        code: 'NOT_FOUND',
        requestId: 'test-request-id-123',
      });
    });

    it('should handle 409 Conflict', () => {
      error(mockRes, 409, 'Resource already exists', 'CONFLICT');

      expect(mockRes.status).toHaveBeenCalledWith(409);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Resource already exists',
        code: 'CONFLICT',
        requestId: 'test-request-id-123',
      });
    });

    it('should handle 422 Unprocessable Entity', () => {
      error(mockRes, 422, 'Validation failed', 'VALIDATION_ERROR');

      expect(mockRes.status).toHaveBeenCalledWith(422);
    });

    it('should handle 429 Too Many Requests', () => {
      error(mockRes, 429, 'Rate limit exceeded', 'RATE_LIMITED');

      expect(mockRes.status).toHaveBeenCalledWith(429);
    });

    it('should handle 500 Internal Server Error', () => {
      error(mockRes, 500, 'Internal server error', 'INTERNAL_ERROR');

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
        requestId: 'test-request-id-123',
      });
    });

    it('should handle 502 Bad Gateway', () => {
      error(mockRes, 502, 'Bad gateway', 'BAD_GATEWAY');

      expect(mockRes.status).toHaveBeenCalledWith(502);
    });

    it('should handle 503 Service Unavailable', () => {
      error(mockRes, 503, 'Service temporarily unavailable', 'SERVICE_UNAVAILABLE');

      expect(mockRes.status).toHaveBeenCalledWith(503);
    });

    it('should handle empty error message', () => {
      error(mockRes, 400, '');

      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: '',
        code: undefined,
        requestId: 'test-request-id-123',
      });
    });

    it('should handle long error messages', () => {
      const longMessage = 'A'.repeat(1000);

      error(mockRes, 400, longMessage);

      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: longMessage,
        code: undefined,
        requestId: 'test-request-id-123',
      });
    });

    it('should handle special characters in error message', () => {
      error(mockRes, 400, 'Error: "test" <script>alert("xss")</script>');

      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Error: "test" <script>alert("xss")</script>',
        code: undefined,
        requestId: 'test-request-id-123',
      });
    });
  });

  describe('paginated', () => {
    const baseUrl = 'http://api.example.com/resources';

    it('should return 200 status code', () => {
      const data = [{ id: 1 }, { id: 2 }];
      const meta: PaginationMeta = {
        currentPage: 1,
        lastPage: 5,
        perPage: 10,
        total: 50,
      };

      paginated(mockRes, data, meta, baseUrl);

      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it('should return correct data array', () => {
      const data = [{ id: 1 }, { id: 2 }];
      const meta: PaginationMeta = {
        currentPage: 1,
        lastPage: 1,
        perPage: 10,
        total: 2,
      };

      paginated(mockRes, data, meta, baseUrl);

      const call = (mockRes.json as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(call.data).toEqual(data);
    });

    it('should return correct meta information', () => {
      const data = [{ id: 1 }];
      const meta: PaginationMeta = {
        currentPage: 2,
        lastPage: 5,
        perPage: 10,
        total: 50,
      };

      paginated(mockRes, data, meta, baseUrl);

      const call = (mockRes.json as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(call.meta).toEqual(meta);
    });

    it('should build correct first page link', () => {
      const data: readonly object[] = [];
      const meta: PaginationMeta = {
        currentPage: 3,
        lastPage: 10,
        perPage: 20,
        total: 200,
      };

      paginated(mockRes, data, meta, baseUrl);

      const call = (mockRes.json as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(call.links.first).toBe('http://api.example.com/resources?page=1&limit=20');
    });

    it('should build correct last page link', () => {
      const data: readonly object[] = [];
      const meta: PaginationMeta = {
        currentPage: 3,
        lastPage: 10,
        perPage: 20,
        total: 200,
      };

      paginated(mockRes, data, meta, baseUrl);

      const call = (mockRes.json as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(call.links.last).toBe('http://api.example.com/resources?page=10&limit=20');
    });

    it('should return null for prev link on first page', () => {
      const data: readonly object[] = [];
      const meta: PaginationMeta = {
        currentPage: 1,
        lastPage: 5,
        perPage: 10,
        total: 50,
      };

      paginated(mockRes, data, meta, baseUrl);

      const call = (mockRes.json as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(call.links.prev).toBeNull();
    });

    it('should return prev link when not on first page', () => {
      const data: readonly object[] = [];
      const meta: PaginationMeta = {
        currentPage: 3,
        lastPage: 5,
        perPage: 10,
        total: 50,
      };

      paginated(mockRes, data, meta, baseUrl);

      const call = (mockRes.json as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(call.links.prev).toBe('http://api.example.com/resources?page=2&limit=10');
    });

    it('should return null for next link on last page', () => {
      const data: readonly object[] = [];
      const meta: PaginationMeta = {
        currentPage: 5,
        lastPage: 5,
        perPage: 10,
        total: 50,
      };

      paginated(mockRes, data, meta, baseUrl);

      const call = (mockRes.json as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(call.links.next).toBeNull();
    });

    it('should return next link when not on last page', () => {
      const data: readonly object[] = [];
      const meta: PaginationMeta = {
        currentPage: 3,
        lastPage: 5,
        perPage: 10,
        total: 50,
      };

      paginated(mockRes, data, meta, baseUrl);

      const call = (mockRes.json as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(call.links.next).toBe('http://api.example.com/resources?page=4&limit=10');
    });

    it('should handle single page results', () => {
      const data = [{ id: 1 }];
      const meta: PaginationMeta = {
        currentPage: 1,
        lastPage: 1,
        perPage: 10,
        total: 1,
      };

      paginated(mockRes, data, meta, baseUrl);

      const call = (mockRes.json as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(call.links.prev).toBeNull();
      expect(call.links.next).toBeNull();
      expect(call.links.first).toBe('http://api.example.com/resources?page=1&limit=10');
      expect(call.links.last).toBe('http://api.example.com/resources?page=1&limit=10');
    });

    it('should handle empty data array', () => {
      const data: readonly object[] = [];
      const meta: PaginationMeta = {
        currentPage: 1,
        lastPage: 1,
        perPage: 10,
        total: 0,
      };

      paginated(mockRes, data, meta, baseUrl);

      const call = (mockRes.json as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(call.data).toEqual([]);
    });

    it('should handle different perPage values', () => {
      const data: readonly object[] = [];
      const meta: PaginationMeta = {
        currentPage: 1,
        lastPage: 100,
        perPage: 5,
        total: 500,
      };

      paginated(mockRes, data, meta, baseUrl);

      const call = (mockRes.json as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(call.links.first).toContain('limit=5');
      expect(call.links.next).toContain('limit=5');
    });

    it('should handle baseUrl with trailing slash', () => {
      const data: readonly object[] = [];
      const meta: PaginationMeta = {
        currentPage: 1,
        lastPage: 2,
        perPage: 10,
        total: 20,
      };

      paginated(mockRes, data, meta, 'http://api.example.com/resources/');

      const call = (mockRes.json as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(call.links.first).toBe('http://api.example.com/resources/?page=1&limit=10');
    });

    it('should handle baseUrl with query parameters', () => {
      const data: readonly object[] = [];
      const meta: PaginationMeta = {
        currentPage: 1,
        lastPage: 2,
        perPage: 10,
        total: 20,
      };

      paginated(mockRes, data, meta, 'http://api.example.com/resources?filter=active');

      const call = (mockRes.json as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(call.links.first).toBe('http://api.example.com/resources?filter=active?page=1&limit=10');
    });

    it('should handle large page numbers', () => {
      const data: readonly object[] = [];
      const meta: PaginationMeta = {
        currentPage: 999,
        lastPage: 1000,
        perPage: 50,
        total: 50000,
      };

      paginated(mockRes, data, meta, baseUrl);

      const call = (mockRes.json as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(call.links.prev).toBe('http://api.example.com/resources?page=998&limit=50');
      expect(call.links.next).toBe('http://api.example.com/resources?page=1000&limit=50');
    });

    it('should handle page 2 correctly', () => {
      const data: readonly object[] = [];
      const meta: PaginationMeta = {
        currentPage: 2,
        lastPage: 3,
        perPage: 10,
        total: 30,
      };

      paginated(mockRes, data, meta, baseUrl);

      const call = (mockRes.json as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(call.links.prev).toBe('http://api.example.com/resources?page=1&limit=10');
      expect(call.links.next).toBe('http://api.example.com/resources?page=3&limit=10');
    });
  });

  describe('requestId handling', () => {
    it('should include requestId from request object', () => {
      success(mockRes, { test: true });

      const call = (mockRes.json as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(call.requestId).toBe('test-request-id-123');
    });

    it('should handle undefined requestId gracefully', () => {
      const resWithoutRequestId = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn().mockReturnThis(),
        req: {} as Request,
      } as unknown as Response;

      success(resWithoutRequestId, { test: true });

      const call = (resWithoutRequestId.json as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(call.requestId).toBeUndefined();
    });
  });
});
