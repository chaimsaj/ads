import { mapEnum } from '../../../infrastructure/utils/enum-mapper';
import type { IDashboardRepository } from '../interfaces/dashboard-repository.interface';
import type {
  DashboardStatsDTO,
  RevenueTimeSeriesDTO,
  CampaignDistributionDTO,
  UserGrowthDTO,
  DashboardPeriod,
} from '../types/analytics.types';

function getSinceDate(period: DashboardPeriod): Date {
  const now = new Date();
  switch (period) {
    case 'day':
      return new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30);
    case 'week':
      return new Date(now.getFullYear(), now.getMonth(), now.getDate() - 90);
    case 'month':
      return new Date(now.getFullYear() - 1, now.getMonth(), 1);
    case 'year':
      return new Date(now.getFullYear() - 5, 0, 1);
  }
}

function getStartOfMonth(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

export class DashboardService {
  constructor(private readonly dashboardRepo: IDashboardRepository) {}

  async getStats(): Promise<DashboardStatsDTO> {
    const startOfMonth = getStartOfMonth();

    const [
      totalUsers,
      newUsersThisMonth,
      activeCampaigns,
      totalCampaigns,
      totalRevenue,
      monthlyRevenue,
      totalImpressions,
      totalClicks,
    ] = await Promise.all([
      this.dashboardRepo.getTotalUsersCount(),
      this.dashboardRepo.getNewUsersCount(startOfMonth),
      this.dashboardRepo.getActiveCampaignsCount(),
      this.dashboardRepo.getTotalCampaignsCount(),
      this.dashboardRepo.getTotalRevenue(),
      this.dashboardRepo.getRevenuesSince(startOfMonth),
      this.dashboardRepo.getTotalImpressions(),
      this.dashboardRepo.getTotalClicks(),
    ]);

    const averageCtr = totalImpressions > 0
      ? Math.round((totalClicks / totalImpressions) * 10000) / 100
      : 0;

    return {
      totalUsers,
      newUsersThisMonth,
      activeCampaigns,
      totalCampaigns,
      totalRevenue,
      monthlyRevenue,
      totalImpressions,
      totalClicks,
      averageCtr,
    };
  }

  async getRevenue(period: DashboardPeriod): Promise<readonly RevenueTimeSeriesDTO[]> {
    const since = getSinceDate(period);
    return this.dashboardRepo.getRevenueTimeSeries(period, since);
  }

  async getCampaignDistribution(): Promise<readonly CampaignDistributionDTO[]> {
    const distribution = await this.dashboardRepo.getCampaignStatusDistribution();
    const total = distribution.reduce((sum, d) => sum + d.count, 0);

    return distribution.map((d) => ({
      status: mapEnum(d.status),
      count: d.count,
      percentage: total > 0 ? Math.round((d.count / total) * 10000) / 100 : 0,
    }));
  }

  async getUserGrowth(period: DashboardPeriod): Promise<readonly UserGrowthDTO[]> {
    const since = getSinceDate(period);
    const growth = await this.dashboardRepo.getUserGrowth(period, since);

    let runningTotal = 0;
    return growth.map((g) => {
      runningTotal += g.newUsers;
      return {
        period: g.period,
        newUsers: g.newUsers,
        totalUsers: runningTotal,
      };
    });
  }
}
