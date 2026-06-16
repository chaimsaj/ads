import type { PrismaClient } from '@prisma/client';

import type { ICampaignStatsRepository } from '../interfaces/campaign-stats-repository.interface';
import type { DailyStatsDTO } from '../types/campaign.types';

export class CampaignStatsRepository implements ICampaignStatsRepository {
  constructor(private readonly db: PrismaClient) {}

  async getDailyStats(campaignId: string, days: number): Promise<readonly DailyStatsDTO[]> {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const stats = await this.db.campaignDailyStats.findMany({
      where: {
        campaignId,
        statDate: { gte: since },
      },
      orderBy: { statDate: 'asc' },
    });

    return stats.map((s) => ({
      date: s.statDate,
      impressions: s.impressions,
      clicks: s.clicks,
      conversions: s.conversions,
      spend: s.spend,
      ctr: s.ctr ?? null,
      cpc: s.cpc ?? null,
      cpm: s.cpm ?? null,
    }));
  }

  async getActiveCampaignsCount(): Promise<number> {
    return this.db.campaign.count({
      where: { status: 'ACTIVE', deletedAt: null },
    });
  }

  async getTotalRevenue(since?: Date): Promise<number> {
    const result = await this.db.transaction.aggregate({
      where: {
        type: 'CHARGE',
        status: 'COMPLETED',
        ...(since && { createdAt: { gte: since } }),
      },
      _sum: { amount: true },
    });
    return result._sum.amount ?? 0;
  }
}
