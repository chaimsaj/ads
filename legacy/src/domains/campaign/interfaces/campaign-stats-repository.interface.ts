import type { DailyStatsDTO } from '../types/campaign.types';

export interface ICampaignStatsRepository {
  getDailyStats(campaignId: string, days: number): Promise<readonly DailyStatsDTO[]>;
  getActiveCampaignsCount(): Promise<number>;
  getTotalRevenue(since?: Date): Promise<number>;
}
