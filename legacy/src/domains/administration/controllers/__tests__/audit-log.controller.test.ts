import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request, Response, NextFunction } from 'express';

import { mockObjectId } from '../../../../../tests/helpers/objectid-helper';
import { AuditLogController } from '../audit-log.controller';
import type { AuditLogService } from '../../services/audit-log.service';

// Mock the response helper module
vi.mock('../../../../infrastructure/http/response.helper', () => ({
  success: vi.fn(),
  paginated: vi.fn(),
}));

import { success, paginated } from '../../../../infrastructure/http/response.helper';

describe('AuditLogController', () => {
  let controller: AuditLogController;
  let mockAuditLogService: Partial<AuditLogService>;
  let mockReq: Request;
  let mockRes: Response;
  let mockNext: NextFunction;

  const mockAuditLog = {
    id: 'log_123',
    action: 'SETTINGS_UPDATED',
    entityType: 'Setting',
    entityId: 'site.name',
    adminId: mockObjectId(1),
    adminName: 'Admin User',
    changes: { before: 'Old Name', after: 'New Name' },
    ipAddress: '192.168.1.1',
    userAgent: 'Mozilla/5.0',
    createdAt: new Date(),
  };

  const mockPaginatedResult = {
    data: [mockAuditLog],
    meta: {
      page: 1,
      limit: 10,
      total: 1,
      totalPages: 1,
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();

    mockAuditLogService = {
      list: vi.fn(),
      getById: vi.fn(),
    };

    mockReq = {
      body: {},
      params: {},
      query: {},
      baseUrl: '/api/v1/admin',
      path: '/audit-logs',
    } as unknown as Request;

    mockRes = {} as Response;

    mockNext = vi.fn();

    controller = new AuditLogController(mockAuditLogService as AuditLogService);
  });

  describe('list', () => {
    it('should call auditLogService.list with filters and pagination', async () => {
      mockReq.query = { page: 1, limit: 10, action: 'SETTINGS_UPDATED' };
      vi.mocked(mockAuditLogService.list!).mockResolvedValue(mockPaginatedResult);

      await controller.list(mockReq, mockRes, mockNext);

      expect(mockAuditLogService.list).toHaveBeenCalledWith(
        { action: 'SETTINGS_UPDATED' },
        { page: 1, limit: 10 },
      );
    });

    it('should call paginated helper on success', async () => {
      mockReq.query = { page: 1, limit: 10 };
      vi.mocked(mockAuditLogService.list!).mockResolvedValue(mockPaginatedResult);

      await controller.list(mockReq, mockRes, mockNext);

      expect(paginated).toHaveBeenCalledWith(
        mockRes,
        mockPaginatedResult.data,
        {
          currentPage: 1,
          lastPage: 1,
          perPage: 10,
          total: 1,
        },
        '/api/v1/admin/audit-logs',
      );
    });

    it('should call next with error on failure', async () => {
      mockReq.query = { page: 1, limit: 10 };
      const error = new Error('Failed to fetch audit logs');
      vi.mocked(mockAuditLogService.list!).mockRejectedValue(error);

      await controller.list(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });

    it('should pass multiple filters correctly', async () => {
      mockReq.query = {
        page: 1,
        limit: 20,
        action: 'USER_SUSPENDED',
        entityType: 'User',
        adminId: '5',
      };
      vi.mocked(mockAuditLogService.list!).mockResolvedValue(mockPaginatedResult);

      await controller.list(mockReq, mockRes, mockNext);

      expect(mockAuditLogService.list).toHaveBeenCalledWith(
        { action: 'USER_SUSPENDED', entityType: 'User', adminId: '5' },
        { page: 1, limit: 20 },
      );
    });
  });

  describe('show', () => {
    it('should call auditLogService.getById with id from params', async () => {
      mockReq.params = { id: 'log_123' };
      vi.mocked(mockAuditLogService.getById!).mockResolvedValue(mockAuditLog);

      await controller.show(mockReq, mockRes, mockNext);

      expect(mockAuditLogService.getById).toHaveBeenCalledWith('log_123');
    });

    it('should call success helper on success', async () => {
      mockReq.params = { id: 'log_123' };
      vi.mocked(mockAuditLogService.getById!).mockResolvedValue(mockAuditLog);

      await controller.show(mockReq, mockRes, mockNext);

      expect(success).toHaveBeenCalledWith(mockRes, mockAuditLog);
    });

    it('should call next with error on failure', async () => {
      mockReq.params = { id: 'nonexistent' };
      const error = new Error('Audit log not found');
      vi.mocked(mockAuditLogService.getById!).mockRejectedValue(error);

      await controller.show(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });
});
