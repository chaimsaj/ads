import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request, Response, NextFunction } from 'express';

import { mockObjectId } from '../../../../../tests/helpers/objectid-helper';
import { CampaignController } from '../campaign.controller';
import type { CampaignService } from '../../services/campaign.service';
import type { CampaignExportService } from '../../services/campaign-export.service';

// Mock the response helper module
vi.mock('../../../../infrastructure/http/response.helper', () => ({
  success: vi.fn(),
  created: vi.fn(),
  noContent: vi.fn(),
  paginated: vi.fn(),
}));

import { success, created, noContent, paginated } from '../../../../infrastructure/http/response.helper';

describe('CampaignController', () => {
  let controller: CampaignController;
  let mockCampaignService: Partial<CampaignService>;
  let mockExportService: Partial<CampaignExportService>;
  let mockReq: Request;
  let mockRes: Response;
  let mockNext: NextFunction;

  const mockCampaign = {
    id: mockObjectId(1),
    name: 'Test Campaign',
    userId: mockObjectId(1),
    status: 'DRAFT',
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

    mockCampaignService = {
      listForUser: vi.fn(),
      getForUser: vi.fn(),
      create: vi.fn(),
      updateForUser: vi.fn(),
      updateStatusForUser: vi.fn(),
      deleteForUser: vi.fn(),
      duplicateForUser: vi.fn(),
      getStatisticsForUser: vi.fn(),
    };

    mockExportService = {
      exportUserCSV: vi.fn(),
    };

    mockReq = {
      body: {},
      params: {},
      query: {},
      user: { sub: mockObjectId(1), email: 'test@example.com', role: 'advertiser', type: 'access' },
      baseUrl: '/api/v1',
      path: '/campaigns',
    } as unknown as Request;

    mockRes = {
      setHeader: vi.fn(),
      send: vi.fn(),
    } as unknown as Response;

    mockNext = vi.fn();

    controller = new CampaignController(
      mockCampaignService as CampaignService,
      mockExportService as CampaignExportService,
    );
  });

  describe('list', () => {
    it('should call campaignService.listForUser with correct parameters', async () => {
      mockReq.query = { page: 1, limit: 10, status: 'ACTIVE' };
      vi.mocked(mockCampaignService.listForUser!).mockResolvedValue(mockPaginatedResult);

      await controller.list(mockReq, mockRes, mockNext);

      expect(mockCampaignService.listForUser).toHaveBeenCalledWith(
        mockObjectId(1),
        { status: 'ACTIVE' },
        { page: 1, limit: 10, sortBy: undefined, sortOrder: undefined },
      );
    });

    it('should call paginated helper on success', async () => {
      vi.mocked(mockCampaignService.listForUser!).mockResolvedValue(mockPaginatedResult);

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
        '/api/v1/campaigns',
      );
    });

    it('should call next with error on failure', async () => {
      const error = new Error('Database error');
      vi.mocked(mockCampaignService.listForUser!).mockRejectedValue(error);

      await controller.list(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });

    it('should extract sort parameters', async () => {
      mockReq.query = { page: 1, limit: 10, sortBy: 'createdAt', sortOrder: 'desc' };
      vi.mocked(mockCampaignService.listForUser!).mockResolvedValue(mockPaginatedResult);

      await controller.list(mockReq, mockRes, mockNext);

      expect(mockCampaignService.listForUser).toHaveBeenCalledWith(
        mockObjectId(1),
        {},
        { page: 1, limit: 10, sortBy: 'createdAt', sortOrder: 'desc' },
      );
    });
  });

  describe('show', () => {
    it('should call campaignService.getForUser with campaign id and user id', async () => {
      mockReq.params = { id: mockObjectId(5) };
      vi.mocked(mockCampaignService.getForUser!).mockResolvedValue(mockCampaign);

      await controller.show(mockReq, mockRes, mockNext);

      expect(mockCampaignService.getForUser).toHaveBeenCalledWith(mockObjectId(5), mockObjectId(1));
    });

    it('should call success helper on success', async () => {
      mockReq.params = { id: mockObjectId(5) };
      vi.mocked(mockCampaignService.getForUser!).mockResolvedValue(mockCampaign);

      await controller.show(mockReq, mockRes, mockNext);

      expect(success).toHaveBeenCalledWith(mockRes, mockCampaign);
    });

    it('should call next with error on failure', async () => {
      mockReq.params = { id: mockObjectId(5) };
      const error = new Error('Campaign not found');
      vi.mocked(mockCampaignService.getForUser!).mockRejectedValue(error);

      await controller.show(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });

    it('should pass id as string', async () => {
      mockReq.params = { id: mockObjectId(123) };
      vi.mocked(mockCampaignService.getForUser!).mockResolvedValue(mockCampaign);

      await controller.show(mockReq, mockRes, mockNext);

      expect(mockCampaignService.getForUser).toHaveBeenCalledWith(mockObjectId(123), mockObjectId(1));
    });
  });

  describe('store', () => {
    const createData = {
      name: 'New Campaign',
      budget: 5000,
      startDate: '2024-01-01',
    };

    it('should call campaignService.create with body and userId', async () => {
      mockReq.body = createData;
      vi.mocked(mockCampaignService.create!).mockResolvedValue(mockCampaign);

      await controller.store(mockReq, mockRes, mockNext);

      expect(mockCampaignService.create).toHaveBeenCalledWith({
        ...createData,
        userId: mockObjectId(1),
      });
    });

    it('should call created helper on success', async () => {
      mockReq.body = createData;
      vi.mocked(mockCampaignService.create!).mockResolvedValue(mockCampaign);

      await controller.store(mockReq, mockRes, mockNext);

      expect(created).toHaveBeenCalledWith(mockRes, mockCampaign, 'Campaign created successfully');
    });

    it('should call next with error on failure', async () => {
      mockReq.body = createData;
      const error = new Error('Validation failed');
      vi.mocked(mockCampaignService.create!).mockRejectedValue(error);

      await controller.store(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('update', () => {
    const updateData = {
      name: 'Updated Campaign',
      budget: 7500,
    };

    it('should call campaignService.updateForUser with id, userId, and body', async () => {
      mockReq.params = { id: mockObjectId(5) };
      mockReq.body = updateData;
      vi.mocked(mockCampaignService.updateForUser!).mockResolvedValue({ ...mockCampaign, ...updateData });

      await controller.update(mockReq, mockRes, mockNext);

      expect(mockCampaignService.updateForUser).toHaveBeenCalledWith(mockObjectId(5), mockObjectId(1), updateData);
    });

    it('should call success helper on success', async () => {
      mockReq.params = { id: mockObjectId(5) };
      mockReq.body = updateData;
      const updatedCampaign = { ...mockCampaign, ...updateData };
      vi.mocked(mockCampaignService.updateForUser!).mockResolvedValue(updatedCampaign);

      await controller.update(mockReq, mockRes, mockNext);

      expect(success).toHaveBeenCalledWith(mockRes, updatedCampaign, 'Campaign updated successfully');
    });

    it('should call next with error on failure', async () => {
      mockReq.params = { id: mockObjectId(5) };
      mockReq.body = updateData;
      const error = new Error('Campaign not found');
      vi.mocked(mockCampaignService.updateForUser!).mockRejectedValue(error);

      await controller.update(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('updateStatus', () => {
    it('should call campaignService.updateStatusForUser with id, userId, and status', async () => {
      mockReq.params = { id: mockObjectId(5) };
      mockReq.body = { status: 'ACTIVE' };
      vi.mocked(mockCampaignService.updateStatusForUser!).mockResolvedValue({ ...mockCampaign, status: 'ACTIVE' });

      await controller.updateStatus(mockReq, mockRes, mockNext);

      expect(mockCampaignService.updateStatusForUser).toHaveBeenCalledWith(mockObjectId(5), mockObjectId(1), 'ACTIVE');
    });

    it('should call success helper on success', async () => {
      mockReq.params = { id: mockObjectId(5) };
      mockReq.body = { status: 'PAUSED' };
      const updatedCampaign = { ...mockCampaign, status: 'PAUSED' };
      vi.mocked(mockCampaignService.updateStatusForUser!).mockResolvedValue(updatedCampaign);

      await controller.updateStatus(mockReq, mockRes, mockNext);

      expect(success).toHaveBeenCalledWith(mockRes, updatedCampaign, 'Campaign status updated');
    });

    it('should call next with error on failure', async () => {
      mockReq.params = { id: mockObjectId(5) };
      mockReq.body = { status: 'ACTIVE' };
      const error = new Error('Invalid status transition');
      vi.mocked(mockCampaignService.updateStatusForUser!).mockRejectedValue(error);

      await controller.updateStatus(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('destroy', () => {
    it('should call campaignService.deleteForUser with id and userId', async () => {
      mockReq.params = { id: mockObjectId(5) };
      vi.mocked(mockCampaignService.deleteForUser!).mockResolvedValue();

      await controller.destroy(mockReq, mockRes, mockNext);

      expect(mockCampaignService.deleteForUser).toHaveBeenCalledWith(mockObjectId(5), mockObjectId(1));
    });

    it('should call noContent helper on success', async () => {
      mockReq.params = { id: mockObjectId(5) };
      vi.mocked(mockCampaignService.deleteForUser!).mockResolvedValue();

      await controller.destroy(mockReq, mockRes, mockNext);

      expect(noContent).toHaveBeenCalledWith(mockRes);
    });

    it('should call next with error on failure', async () => {
      mockReq.params = { id: mockObjectId(5) };
      const error = new Error('Cannot delete active campaign');
      vi.mocked(mockCampaignService.deleteForUser!).mockRejectedValue(error);

      await controller.destroy(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('duplicate', () => {
    it('should call campaignService.duplicateForUser with id and userId', async () => {
      mockReq.params = { id: mockObjectId(5) };
      vi.mocked(mockCampaignService.duplicateForUser!).mockResolvedValue({ ...mockCampaign, id: mockObjectId(6) });

      await controller.duplicate(mockReq, mockRes, mockNext);

      expect(mockCampaignService.duplicateForUser).toHaveBeenCalledWith(mockObjectId(5), mockObjectId(1));
    });

    it('should call created helper on success', async () => {
      mockReq.params = { id: mockObjectId(5) };
      const duplicatedCampaign = { ...mockCampaign, id: mockObjectId(6) };
      vi.mocked(mockCampaignService.duplicateForUser!).mockResolvedValue(duplicatedCampaign);

      await controller.duplicate(mockReq, mockRes, mockNext);

      expect(created).toHaveBeenCalledWith(mockRes, duplicatedCampaign, 'Campaign duplicated successfully');
    });

    it('should call next with error on failure', async () => {
      mockReq.params = { id: mockObjectId(5) };
      const error = new Error('Campaign not found');
      vi.mocked(mockCampaignService.duplicateForUser!).mockRejectedValue(error);

      await controller.duplicate(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('statistics', () => {
    const mockStats = {
      totalCampaigns: 10,
      activeCampaigns: 5,
      totalBudget: 50000,
      totalSpent: 25000,
    };

    it('should call campaignService.getStatisticsForUser with userId', async () => {
      vi.mocked(mockCampaignService.getStatisticsForUser!).mockResolvedValue(mockStats);

      await controller.statistics(mockReq, mockRes, mockNext);

      expect(mockCampaignService.getStatisticsForUser).toHaveBeenCalledWith(mockObjectId(1));
    });

    it('should call success helper on success', async () => {
      vi.mocked(mockCampaignService.getStatisticsForUser!).mockResolvedValue(mockStats);

      await controller.statistics(mockReq, mockRes, mockNext);

      expect(success).toHaveBeenCalledWith(mockRes, mockStats);
    });

    it('should call next with error on failure', async () => {
      const error = new Error('Failed to fetch statistics');
      vi.mocked(mockCampaignService.getStatisticsForUser!).mockRejectedValue(error);

      await controller.statistics(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('exportCsv', () => {
    const mockCsvData = 'id,name,status\n1,Test Campaign,ACTIVE';

    it('should call exportService.exportUserCSV with userId and filters', async () => {
      mockReq.query = { status: 'ACTIVE' };
      vi.mocked(mockExportService.exportUserCSV!).mockResolvedValue(mockCsvData);

      await controller.exportCsv(mockReq, mockRes, mockNext);

      expect(mockExportService.exportUserCSV).toHaveBeenCalledWith(mockObjectId(1), { status: 'ACTIVE' });
    });

    it('should set correct headers and send CSV data', async () => {
      vi.mocked(mockExportService.exportUserCSV!).mockResolvedValue(mockCsvData);

      await controller.exportCsv(mockReq, mockRes, mockNext);

      expect(mockRes.setHeader).toHaveBeenCalledWith('Content-Type', 'text/csv');
      expect(mockRes.setHeader).toHaveBeenCalledWith('Content-Disposition', 'attachment; filename="campaigns.csv"');
      expect(mockRes.send).toHaveBeenCalledWith(mockCsvData);
    });

    it('should call next with error on failure', async () => {
      const error = new Error('Export failed');
      vi.mocked(mockExportService.exportUserCSV!).mockRejectedValue(error);

      await controller.exportCsv(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('user context', () => {
    it('should use correct user id for all operations', async () => {
      mockReq.user = { sub: mockObjectId(42), email: 'other@example.com', role: 'advertiser', type: 'access' };
      mockReq.params = { id: mockObjectId(10) };
      vi.mocked(mockCampaignService.getForUser!).mockResolvedValue(mockCampaign);

      await controller.show(mockReq, mockRes, mockNext);

      expect(mockCampaignService.getForUser).toHaveBeenCalledWith(mockObjectId(10), mockObjectId(42));
    });
  });
});
