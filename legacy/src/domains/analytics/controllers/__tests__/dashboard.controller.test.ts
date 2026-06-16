import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request, Response, NextFunction } from 'express';

import { DashboardController } from '../dashboard.controller';
import type { DashboardService } from '../../services/dashboard.service';

// Mock the response helper module
vi.mock('../../../../infrastructure/http/response.helper', () => ({
  success: vi.fn(),
}));

import { success } from '../../../../infrastructure/http/response.helper';

describe('DashboardController', () => {
  let controller: DashboardController;
  let mockDashboardService: Partial<DashboardService>;
  let mockReq: Request;
  let mockRes: Response;
  let mockNext: NextFunction;

  beforeEach(() => {
    vi.clearAllMocks();

    mockDashboardService = {
      getStats: vi.fn(),
      getRevenue: vi.fn(),
      getCampaignDistribution: vi.fn(),
      getUserGrowth: vi.fn(),
    };

    mockReq = {
      query: {},
    } as unknown as Request;

    mockRes = {} as Response;

    mockNext = vi.fn();

    controller = new DashboardController(mockDashboardService as DashboardService);
  });

  describe('stats', () => {
    const statsData = {
      totalUsers: 1000,
      totalCampaigns: 500,
      totalRevenue: 50000,
      activeUsers: 750,
    };

    it('should call dashboardService.getStats', async () => {
      vi.mocked(mockDashboardService.getStats!).mockResolvedValue(statsData);

      await controller.stats(mockReq, mockRes, mockNext);

      expect(mockDashboardService.getStats).toHaveBeenCalled();
    });

    it('should call success helper on success', async () => {
      vi.mocked(mockDashboardService.getStats!).mockResolvedValue(statsData);

      await controller.stats(mockReq, mockRes, mockNext);

      expect(success).toHaveBeenCalledWith(mockRes, statsData);
    });

    it('should call next with error on failure', async () => {
      const error = new Error('Failed to fetch stats');
      vi.mocked(mockDashboardService.getStats!).mockRejectedValue(error);

      await controller.stats(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('revenue', () => {
    const revenueData = {
      labels: ['Jan', 'Feb', 'Mar'],
      data: [10000, 15000, 20000],
      total: 45000,
    };

    it('should call dashboardService.getRevenue with period from query', async () => {
      mockReq.query = { period: 'month' };
      vi.mocked(mockDashboardService.getRevenue!).mockResolvedValue(revenueData);

      await controller.revenue(mockReq, mockRes, mockNext);

      expect(mockDashboardService.getRevenue).toHaveBeenCalledWith('month');
    });

    it('should call success helper on success', async () => {
      mockReq.query = { period: 'week' };
      vi.mocked(mockDashboardService.getRevenue!).mockResolvedValue(revenueData);

      await controller.revenue(mockReq, mockRes, mockNext);

      expect(success).toHaveBeenCalledWith(mockRes, revenueData);
    });

    it('should call next with error on failure', async () => {
      mockReq.query = { period: 'year' };
      const error = new Error('Failed to fetch revenue');
      vi.mocked(mockDashboardService.getRevenue!).mockRejectedValue(error);

      await controller.revenue(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });

    it('should handle undefined period', async () => {
      mockReq.query = {};
      vi.mocked(mockDashboardService.getRevenue!).mockResolvedValue(revenueData);

      await controller.revenue(mockReq, mockRes, mockNext);

      expect(mockDashboardService.getRevenue).toHaveBeenCalledWith(undefined);
    });
  });

  describe('campaigns', () => {
    const campaignData = {
      byStatus: {
        active: 100,
        paused: 50,
        completed: 200,
        draft: 25,
      },
      byType: {
        display: 150,
        video: 100,
        native: 125,
      },
    };

    it('should call dashboardService.getCampaignDistribution', async () => {
      vi.mocked(mockDashboardService.getCampaignDistribution!).mockResolvedValue(campaignData);

      await controller.campaigns(mockReq, mockRes, mockNext);

      expect(mockDashboardService.getCampaignDistribution).toHaveBeenCalled();
    });

    it('should call success helper on success', async () => {
      vi.mocked(mockDashboardService.getCampaignDistribution!).mockResolvedValue(campaignData);

      await controller.campaigns(mockReq, mockRes, mockNext);

      expect(success).toHaveBeenCalledWith(mockRes, campaignData);
    });

    it('should call next with error on failure', async () => {
      const error = new Error('Failed to fetch campaigns');
      vi.mocked(mockDashboardService.getCampaignDistribution!).mockRejectedValue(error);

      await controller.campaigns(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('users', () => {
    const userData = {
      labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
      newUsers: [50, 75, 60, 90],
      activeUsers: [400, 450, 500, 550],
    };

    it('should call dashboardService.getUserGrowth with period from query', async () => {
      mockReq.query = { period: 'month' };
      vi.mocked(mockDashboardService.getUserGrowth!).mockResolvedValue(userData);

      await controller.users(mockReq, mockRes, mockNext);

      expect(mockDashboardService.getUserGrowth).toHaveBeenCalledWith('month');
    });

    it('should call success helper on success', async () => {
      mockReq.query = { period: 'week' };
      vi.mocked(mockDashboardService.getUserGrowth!).mockResolvedValue(userData);

      await controller.users(mockReq, mockRes, mockNext);

      expect(success).toHaveBeenCalledWith(mockRes, userData);
    });

    it('should call next with error on failure', async () => {
      mockReq.query = { period: 'year' };
      const error = new Error('Failed to fetch users');
      vi.mocked(mockDashboardService.getUserGrowth!).mockRejectedValue(error);

      await controller.users(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });

    it('should handle undefined period', async () => {
      mockReq.query = {};
      vi.mocked(mockDashboardService.getUserGrowth!).mockResolvedValue(userData);

      await controller.users(mockReq, mockRes, mockNext);

      expect(mockDashboardService.getUserGrowth).toHaveBeenCalledWith(undefined);
    });
  });
});
