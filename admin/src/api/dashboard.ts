import { apiClient } from './client';
import { activityApi } from './activity';
import { campaignsApi } from './campaigns';
import type { Activity, DashboardData } from '../types';

export interface DashboardTrendPoint {
  date: string;
  impressions: number;
  clicks: number;
  conversions: number;
  spend: number;
  revenue: number;
}

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
    const [raw, recentActivity, pending] = await Promise.all([
      apiClient.post<BackendDashboardStats>('/dashboard/stats'),
      activityApi.getRecent(12).catch((): Activity[] => []),
      // Real pending-approvals count = campaigns awaiting review (server-paginated total).
      campaignsApi
        .getAll({ status: 'review', limit: 1 })
        .then((r) => r.pagination.total)
        .catch((): number => 0),
    ]);
    return {
      stats: {
        totalUsers: raw.totalUsers ?? 0,
        newUsersThisMonth: raw.newUsersThisMonth ?? 0,
        totalCampaigns: raw.totalCampaigns ?? 0,
        activeCampaigns: raw.activeCampaigns ?? 0,
        pendingApprovals: pending,
        totalRevenue: raw.totalRevenue ?? 0,
        monthlyRevenue: raw.monthlyRevenue ?? 0,
        totalImpressions: raw.totalImpressions ?? 0,
        totalClicks: raw.totalClicks ?? 0,
        averageCtr: raw.averageCtr ?? 0,
      },
      recentActivity,
    };
  },

  getTrend: async (days = 30): Promise<DashboardTrendPoint[]> => {
    try {
      const data = await apiClient.post<DashboardTrendPoint[]>('/dashboard/trend', { days });
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  },
};
