import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request, Response, NextFunction } from 'express';

import { mockObjectId } from '../../../../../tests/helpers/objectid-helper';
import { AdminCampaignController } from '../admin-campaign.controller';
import type { CampaignReviewService } from '../../services/campaign-review.service';
import type { CampaignExportService } from '../../services/campaign-export.service';

// Mock the response helper module
vi.mock('../../../../infrastructure/http/response.helper', () => ({
  success: vi.fn(),
  noContent: vi.fn(),
  paginated: vi.fn(),
}));

import { success, noContent, paginated } from '../../../../infrastructure/http/response.helper';

describe('AdminCampaignController', () => {
  let controller: AdminCampaignController;
  let mockReviewService: Partial<CampaignReviewService>;
  let mockExportService: Partial<CampaignExportService>;
  let mockReq: Request;
  let mockRes: Response;
  let mockNext: NextFunction;

  const mockCampaign = {
    id: mockObjectId(1),
    name: 'Test Campaign',
    userId: mockObjectId(1),
    status: 'PENDING_REVIEW',
    budget: 1000,
    createdAt: new Date(),
  };

  const mockPaginatedResult = {
    data: [mockCampaign],
    meta: {
      page: 1,
      limit: 10,
      total: 1,
      totalPages: 1,
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();

    mockReviewService = {
      listAll: vi.fn(),
      getById: vi.fn(),
      approve: vi.fn(),
      reject: vi.fn(),
      updateStatus: vi.fn(),
      deleteCampaign: vi.fn(),
      bulkUpdateStatus: vi.fn(),
      bulkDelete: vi.fn(),
      getStatusCounts: vi.fn(),
    };

    mockExportService = {
      exportCSV: vi.fn(),
    };

    mockReq = {
      body: {},
      params: {},
      query: {},
      user: { sub: mockObjectId(1), email: 'admin@example.com', role: 'admin', type: 'admin_access' },
      baseUrl: '/api/v1/admin',
      path: '/campaigns',
      ip: '192.168.1.1',
      headers: { 'user-agent': 'Mozilla/5.0' },
    } as unknown as Request;

    mockRes = {
      setHeader: vi.fn(),
      send: vi.fn(),
    } as unknown as Response;

    mockNext = vi.fn();

    controller = new AdminCampaignController(
      mockReviewService as CampaignReviewService,
      mockExportService as CampaignExportService,
    );
  });

  describe('list', () => {
    it('should call reviewService.listAll with correct parameters', async () => {
      mockReq.query = { page: 1, limit: 10, status: 'PENDING_REVIEW' };
      vi.mocked(mockReviewService.listAll!).mockResolvedValue(mockPaginatedResult);

      await controller.list(mockReq, mockRes, mockNext);

      expect(mockReviewService.listAll).toHaveBeenCalledWith(
        { status: 'PENDING_REVIEW' },
        { page: 1, limit: 10, sortBy: undefined, sortOrder: undefined },
      );
    });

    it('should call paginated helper on success', async () => {
      vi.mocked(mockReviewService.listAll!).mockResolvedValue(mockPaginatedResult);

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
        '/api/v1/admin/campaigns',
      );
    });

    it('should call next with error on failure', async () => {
      const error = new Error('Database error');
      vi.mocked(mockReviewService.listAll!).mockRejectedValue(error);

      await controller.list(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('show', () => {
    it('should call reviewService.getById with campaign id', async () => {
      mockReq.params = { id: mockObjectId(5) };
      vi.mocked(mockReviewService.getById!).mockResolvedValue(mockCampaign);

      await controller.show(mockReq, mockRes, mockNext);

      expect(mockReviewService.getById).toHaveBeenCalledWith(mockObjectId(5));
    });

    it('should call success helper on success', async () => {
      mockReq.params = { id: mockObjectId(5) };
      vi.mocked(mockReviewService.getById!).mockResolvedValue(mockCampaign);

      await controller.show(mockReq, mockRes, mockNext);

      expect(success).toHaveBeenCalledWith(mockRes, mockCampaign);
    });

    it('should call next with error on failure', async () => {
      mockReq.params = { id: mockObjectId(5) };
      const error = new Error('Campaign not found');
      vi.mocked(mockReviewService.getById!).mockRejectedValue(error);

      await controller.show(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('approve', () => {
    it('should call reviewService.approve with correct parameters', async () => {
      mockReq.params = { id: mockObjectId(5) };
      vi.mocked(mockReviewService.approve!).mockResolvedValue({ ...mockCampaign, status: 'APPROVED' });

      await controller.approve(mockReq, mockRes, mockNext);

      expect(mockReviewService.approve).toHaveBeenCalledWith(mockObjectId(5), mockObjectId(1), '192.168.1.1', 'Mozilla/5.0');
    });

    it('should call success helper with approval message', async () => {
      mockReq.params = { id: mockObjectId(5) };
      const approvedCampaign = { ...mockCampaign, status: 'APPROVED' };
      vi.mocked(mockReviewService.approve!).mockResolvedValue(approvedCampaign);

      await controller.approve(mockReq, mockRes, mockNext);

      expect(success).toHaveBeenCalledWith(mockRes, approvedCampaign, 'Campaign approved');
    });

    it('should use "unknown" for ip when not available', async () => {
      mockReq.params = { id: mockObjectId(5) };
      mockReq.ip = undefined;
      vi.mocked(mockReviewService.approve!).mockResolvedValue(mockCampaign);

      await controller.approve(mockReq, mockRes, mockNext);

      expect(mockReviewService.approve).toHaveBeenCalledWith(mockObjectId(5), mockObjectId(1), 'unknown', 'Mozilla/5.0');
    });

    it('should call next with error on failure', async () => {
      mockReq.params = { id: mockObjectId(5) };
      const error = new Error('Cannot approve campaign');
      vi.mocked(mockReviewService.approve!).mockRejectedValue(error);

      await controller.approve(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('reject', () => {
    it('should call reviewService.reject with correct parameters', async () => {
      mockReq.params = { id: mockObjectId(5) };
      mockReq.body = { reason: 'Inappropriate content' };
      vi.mocked(mockReviewService.reject!).mockResolvedValue({ ...mockCampaign, status: 'REJECTED' });

      await controller.reject(mockReq, mockRes, mockNext);

      expect(mockReviewService.reject).toHaveBeenCalledWith(
        mockObjectId(5),
        mockObjectId(1),
        'Inappropriate content',
        '192.168.1.1',
        'Mozilla/5.0',
      );
    });

    it('should call success helper with rejection message', async () => {
      mockReq.params = { id: mockObjectId(5) };
      mockReq.body = { reason: 'Violates policy' };
      const rejectedCampaign = { ...mockCampaign, status: 'REJECTED' };
      vi.mocked(mockReviewService.reject!).mockResolvedValue(rejectedCampaign);

      await controller.reject(mockReq, mockRes, mockNext);

      expect(success).toHaveBeenCalledWith(mockRes, rejectedCampaign, 'Campaign rejected');
    });

    it('should call next with error on failure', async () => {
      mockReq.params = { id: mockObjectId(5) };
      mockReq.body = { reason: 'Test' };
      const error = new Error('Campaign already rejected');
      vi.mocked(mockReviewService.reject!).mockRejectedValue(error);

      await controller.reject(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('updateStatus', () => {
    it('should call reviewService.updateStatus with correct parameters', async () => {
      mockReq.params = { id: mockObjectId(5) };
      mockReq.body = { status: 'ACTIVE' };
      vi.mocked(mockReviewService.updateStatus!).mockResolvedValue({ ...mockCampaign, status: 'ACTIVE' });

      await controller.updateStatus(mockReq, mockRes, mockNext);

      expect(mockReviewService.updateStatus).toHaveBeenCalledWith(
        mockObjectId(5),
        'ACTIVE',
        mockObjectId(1),
        '192.168.1.1',
        'Mozilla/5.0',
      );
    });

    it('should call success helper with status update message', async () => {
      mockReq.params = { id: mockObjectId(5) };
      mockReq.body = { status: 'PAUSED' };
      const updatedCampaign = { ...mockCampaign, status: 'PAUSED' };
      vi.mocked(mockReviewService.updateStatus!).mockResolvedValue(updatedCampaign);

      await controller.updateStatus(mockReq, mockRes, mockNext);

      expect(success).toHaveBeenCalledWith(mockRes, updatedCampaign, 'Campaign status updated');
    });

    it('should call next with error on failure', async () => {
      mockReq.params = { id: mockObjectId(5) };
      mockReq.body = { status: 'ACTIVE' };
      const error = new Error('Invalid status transition');
      vi.mocked(mockReviewService.updateStatus!).mockRejectedValue(error);

      await controller.updateStatus(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('destroy', () => {
    it('should call reviewService.deleteCampaign with correct parameters', async () => {
      mockReq.params = { id: mockObjectId(5) };
      vi.mocked(mockReviewService.deleteCampaign!).mockResolvedValue();

      await controller.destroy(mockReq, mockRes, mockNext);

      expect(mockReviewService.deleteCampaign).toHaveBeenCalledWith(mockObjectId(5), mockObjectId(1), '192.168.1.1', 'Mozilla/5.0');
    });

    it('should call noContent helper on success', async () => {
      mockReq.params = { id: mockObjectId(5) };
      vi.mocked(mockReviewService.deleteCampaign!).mockResolvedValue();

      await controller.destroy(mockReq, mockRes, mockNext);

      expect(noContent).toHaveBeenCalledWith(mockRes);
    });

    it('should call next with error on failure', async () => {
      mockReq.params = { id: mockObjectId(5) };
      const error = new Error('Cannot delete campaign');
      vi.mocked(mockReviewService.deleteCampaign!).mockRejectedValue(error);

      await controller.destroy(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('bulkUpdateStatus', () => {
    it('should call reviewService.bulkUpdateStatus with correct parameters', async () => {
      mockReq.body = { ids: [mockObjectId(1), mockObjectId(2), mockObjectId(3)], status: 'ACTIVE' };
      const result = { updated: 3 };
      vi.mocked(mockReviewService.bulkUpdateStatus!).mockResolvedValue(result);

      await controller.bulkUpdateStatus(mockReq, mockRes, mockNext);

      expect(mockReviewService.bulkUpdateStatus).toHaveBeenCalledWith(
        [mockObjectId(1), mockObjectId(2), mockObjectId(3)],
        'ACTIVE',
        mockObjectId(1),
        '192.168.1.1',
        'Mozilla/5.0',
      );
    });

    it('should call success helper on success', async () => {
      mockReq.body = { ids: [mockObjectId(1), mockObjectId(2)], status: 'PAUSED' };
      const result = { updated: 2 };
      vi.mocked(mockReviewService.bulkUpdateStatus!).mockResolvedValue(result);

      await controller.bulkUpdateStatus(mockReq, mockRes, mockNext);

      expect(success).toHaveBeenCalledWith(mockRes, result);
    });

    it('should call next with error on failure', async () => {
      mockReq.body = { ids: [mockObjectId(1)], status: 'ACTIVE' };
      const error = new Error('Bulk update failed');
      vi.mocked(mockReviewService.bulkUpdateStatus!).mockRejectedValue(error);

      await controller.bulkUpdateStatus(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('bulkDelete', () => {
    it('should call reviewService.bulkDelete with correct parameters', async () => {
      mockReq.body = { ids: [mockObjectId(1), mockObjectId(2), mockObjectId(3)] };
      const result = { deleted: 3 };
      vi.mocked(mockReviewService.bulkDelete!).mockResolvedValue(result);

      await controller.bulkDelete(mockReq, mockRes, mockNext);

      expect(mockReviewService.bulkDelete).toHaveBeenCalledWith(
        [mockObjectId(1), mockObjectId(2), mockObjectId(3)],
        mockObjectId(1),
        '192.168.1.1',
        'Mozilla/5.0',
      );
    });

    it('should call success helper on success', async () => {
      mockReq.body = { ids: [mockObjectId(1), mockObjectId(2)] };
      const result = { deleted: 2 };
      vi.mocked(mockReviewService.bulkDelete!).mockResolvedValue(result);

      await controller.bulkDelete(mockReq, mockRes, mockNext);

      expect(success).toHaveBeenCalledWith(mockRes, result);
    });

    it('should call next with error on failure', async () => {
      mockReq.body = { ids: [mockObjectId(1)] };
      const error = new Error('Bulk delete failed');
      vi.mocked(mockReviewService.bulkDelete!).mockRejectedValue(error);

      await controller.bulkDelete(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('statusCounts', () => {
    const mockCounts = {
      DRAFT: 5,
      PENDING_REVIEW: 10,
      APPROVED: 20,
      ACTIVE: 15,
      PAUSED: 3,
      COMPLETED: 8,
      REJECTED: 2,
    };

    it('should call reviewService.getStatusCounts', async () => {
      vi.mocked(mockReviewService.getStatusCounts!).mockResolvedValue(mockCounts);

      await controller.statusCounts(mockReq, mockRes, mockNext);

      expect(mockReviewService.getStatusCounts).toHaveBeenCalled();
    });

    it('should call success helper on success', async () => {
      vi.mocked(mockReviewService.getStatusCounts!).mockResolvedValue(mockCounts);

      await controller.statusCounts(mockReq, mockRes, mockNext);

      expect(success).toHaveBeenCalledWith(mockRes, mockCounts);
    });

    it('should call next with error on failure', async () => {
      const error = new Error('Failed to get counts');
      vi.mocked(mockReviewService.getStatusCounts!).mockRejectedValue(error);

      await controller.statusCounts(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('exportCsv', () => {
    const mockCsvData = 'id,name,status\n1,Test Campaign,ACTIVE';

    it('should call exportService.exportCSV with filters', async () => {
      mockReq.query = { status: 'ACTIVE' };
      vi.mocked(mockExportService.exportCSV!).mockResolvedValue(mockCsvData);

      await controller.exportCsv(mockReq, mockRes, mockNext);

      expect(mockExportService.exportCSV).toHaveBeenCalledWith({ status: 'ACTIVE' });
    });

    it('should set correct headers and send CSV data', async () => {
      vi.mocked(mockExportService.exportCSV!).mockResolvedValue(mockCsvData);

      await controller.exportCsv(mockReq, mockRes, mockNext);

      expect(mockRes.setHeader).toHaveBeenCalledWith('Content-Type', 'text/csv');
      expect(mockRes.setHeader).toHaveBeenCalledWith('Content-Disposition', 'attachment; filename="campaigns.csv"');
      expect(mockRes.send).toHaveBeenCalledWith(mockCsvData);
    });

    it('should call next with error on failure', async () => {
      const error = new Error('Export failed');
      vi.mocked(mockExportService.exportCSV!).mockRejectedValue(error);

      await controller.exportCsv(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('admin context', () => {
    it('should use correct admin id for all operations', async () => {
      mockReq.user = { sub: mockObjectId(42), email: 'superadmin@example.com', role: 'super_admin', type: 'admin_access' };
      mockReq.params = { id: mockObjectId(10) };
      vi.mocked(mockReviewService.approve!).mockResolvedValue(mockCampaign);

      await controller.approve(mockReq, mockRes, mockNext);

      expect(mockReviewService.approve).toHaveBeenCalledWith(mockObjectId(10), mockObjectId(42), expect.any(String), expect.any(String));
    });
  });
});
