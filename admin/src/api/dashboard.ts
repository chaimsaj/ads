import { apiClient } from './client';
import { activityApi } from './activity';
import type { Activity, DashboardData } from '../types';

interface BackendDashboardStats {
  totalUsers: number;
  newUsersThisMonth: number;
  activeCampaigns: number;
  totalCampaigns: number;
  totalRevenue: number;
  monthlyRevenue: number;
  totalImpressions: number;
  totalClicks: number;
  averageCtr: number;
}

export const dashboardApi = {
  getStats: async (): Promise<DashboardData> => {
    const [raw, recentActivity] = await Promise.all([
      apiClient.post<BackendDashboardStats>('/dashboard/stats'),
      activityApi.getRecent(12).catch((): Activity[] => []),
    ]);
    return {
      stats: {
        totalUsers: raw.totalUsers ?? 0,
        activeUsers: raw.newUsersThisMonth ?? 0,
        totalCampaigns: raw.totalCampaigns ?? 0,
        activeCampaigns: raw.activeCampaigns ?? 0,
        totalRevenue: raw.totalRevenue ?? 0,
        pendingApprovals: 0,
        userGrowth: 0,
        campaignGrowth: 0,
        revenueGrowth: 0,
      },
      recentActivity,
    };
  },
};
