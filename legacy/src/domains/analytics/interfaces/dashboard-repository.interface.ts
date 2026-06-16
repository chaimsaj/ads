import type { DashboardPeriod } from '../types/analytics.types';

export interface RawRevenueSeries {
  readonly period: string;
  readonly revenue: number;
  readonly transactions: number;
}

export interface RawUserGrowth {
  readonly period: string;
  readonly newUsers: number;
}

export interface StatusCount {
  readonly status: string;
  readonly count: number;
}

export interface IDashboardRepository {
  getTotalUsersCount(): Promise<number>;
  getNewUsersCount(since: Date): Promise<number>;
  getActiveCampaignsCount(): Promise<number>;
  getTotalCampaignsCount(): Promise<number>;
  getTotalRevenue(): Promise<number>;
  getRevenuesSince(since: Date): Promise<number>;
  getTotalImpressions(): Promise<number>;
  getTotalClicks(): Promise<number>;
  getRevenueTimeSeries(period: DashboardPeriod, since: Date): Promise<readonly RawRevenueSeries[]>;
  getCampaignStatusDistribution(): Promise<readonly StatusCount[]>;
  getUserGrowth(period: DashboardPeriod, since: Date): Promise<readonly RawUserGrowth[]>;
}
