import { describe, it, expect, vi, beforeEach } from 'vitest';

import type { IDashboardRepository } from '../../interfaces/dashboard-repository.interface';
import { DashboardService } from '../dashboard.service';

function createMockRepo(): IDashboardRepository {
  return {
    getTotalUsersCount: vi.fn().mockResolvedValue(100),
    getNewUsersCount: vi.fn().mockResolvedValue(15),
    getActiveCampaignsCount: vi.fn().mockResolvedValue(25),
    getTotalCampaignsCount: vi.fn().mockResolvedValue(80),
    getTotalRevenue: vi.fn().mockResolvedValue(50000),
    getRevenuesSince: vi.fn().mockResolvedValue(5000),
    getTotalImpressions: vi.fn().mockResolvedValue(1000000),
    getTotalClicks: vi.fn().mockResolvedValue(50000),
    getRevenueTimeSeries: vi.fn().mockResolvedValue([]),
    getCampaignStatusDistribution: vi.fn().mockResolvedValue([]),
    getUserGrowth: vi.fn().mockResolvedValue([]),
  };
}

describe('DashboardService', () => {
  let service: DashboardService;
  let repo: IDashboardRepository;

  beforeEach(() => {
    repo = createMockRepo();
    service = new DashboardService(repo);
  });

  describe('getStats', () => {
    it('should return aggregated dashboard stats', async () => {
      const result = await service.getStats();

      expect(result.totalUsers).toBe(100);
      expect(result.newUsersThisMonth).toBe(15);
      expect(result.activeCampaigns).toBe(25);
      expect(result.totalCampaigns).toBe(80);
      expect(result.totalRevenue).toBe(50000);
      expect(result.monthlyRevenue).toBe(5000);
      expect(result.totalImpressions).toBe(1000000);
      expect(result.totalClicks).toBe(50000);
      expect(result.averageCtr).toBe(5);
    });

    it('should return 0 averageCtr when no impressions', async () => {
      (repo.getTotalImpressions as ReturnType<typeof vi.fn>).mockResolvedValue(0);
      (repo.getTotalClicks as ReturnType<typeof vi.fn>).mockResolvedValue(0);

      const result = await service.getStats();

      expect(result.averageCtr).toBe(0);
    });
  });

  describe('getRevenue', () => {
    it('should return revenue time series', async () => {
      const mockData = [
        { period: '2025-01', revenue: 1000, transactions: 10 },
        { period: '2025-02', revenue: 1500, transactions: 15 },
      ];
      (repo.getRevenueTimeSeries as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

      const result = await service.getRevenue('month');

      expect(result).toHaveLength(2);
      expect(result[0].period).toBe('2025-01');
      expect(result[0].revenue).toBe(1000);
    });
  });

  describe('getCampaignDistribution', () => {
    it('should return status distribution with percentages', async () => {
      (repo.getCampaignStatusDistribution as ReturnType<typeof vi.fn>).mockResolvedValue([
        { status: 'ACTIVE', count: 30 },
        { status: 'DRAFT', count: 70 },
      ]);

      const result = await service.getCampaignDistribution();

      expect(result).toHaveLength(2);
      expect(result[0].status).toBe('active');
      expect(result[0].percentage).toBe(30);
      expect(result[1].percentage).toBe(70);
    });

    it('should handle empty distribution', async () => {
      const result = await service.getCampaignDistribution();

      expect(result).toHaveLength(0);
    });
  });

  describe('getUserGrowth', () => {
    it('should return user growth with running totals', async () => {
      (repo.getUserGrowth as ReturnType<typeof vi.fn>).mockResolvedValue([
        { period: '2025-01', newUsers: 10 },
        { period: '2025-02', newUsers: 15 },
        { period: '2025-03', newUsers: 20 },
      ]);

      const result = await service.getUserGrowth('month');

      expect(result).toHaveLength(3);
      expect(result[0].totalUsers).toBe(10);
      expect(result[1].totalUsers).toBe(25);
      expect(result[2].totalUsers).toBe(45);
    });
  });
});
