export interface DashboardStatsDTO {
  readonly totalUsers: number;
  readonly newUsersThisMonth: number;
  readonly activeCampaigns: number;
  readonly totalCampaigns: number;
  readonly totalRevenue: number;
  readonly monthlyRevenue: number;
  readonly totalImpressions: number;
  readonly totalClicks: number;
  readonly averageCtr: number;
}

export interface RevenueTimeSeriesDTO {
  readonly period: string;
  readonly revenue: number;
  readonly transactions: number;
}

export interface CampaignDistributionDTO {
  readonly status: string;
  readonly count: number;
  readonly percentage: number;
}

export interface UserGrowthDTO {
  readonly period: string;
  readonly newUsers: number;
  readonly totalUsers: number;
}

export type DashboardPeriod = 'day' | 'week' | 'month' | 'year';
