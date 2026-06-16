import type { PrismaClient } from '@prisma/client';

import { NotFoundError } from '../../../infrastructure/errors';

const DEFAULT_DEPOSIT_VALUE = 5000;

export interface PerformanceSummary {
  campaignId: string;
  campaignName: string;
  adFormat: string;
  status: string;
  startDate: string | null;
  endDate: string | null;
  locationName: string | null;
  budget: number;
  spend: number;
  impressions: number;
  clicks: number;
  applications: number;
  deposits: number;
  ctr: number;
  cpc: number;
  cpa: number;
  roi: number;
  conversionRate: number;
}

export interface DailyPerformance {
  date: string;
  impressions: number;
  clicks: number;
  applications: number;
  deposits: number;
  spend: number;
}

export class CampaignPerformanceService {
  constructor(private readonly db: PrismaClient) {}

  async getSummary(campaignId: string, userId: string): Promise<PerformanceSummary> {
    const campaign = await this.db.campaign.findFirst({
      where: { id: campaignId, userId },
      include: { targeting: { select: { locationName: true } } },
    });

    if (!campaign) {
      throw new NotFoundError('Campaign');
    }

    const ctr = campaign.impressions > 0
      ? (campaign.clicks / campaign.impressions) * 100
      : 0;
    const cpc = campaign.clicks > 0
      ? campaign.spent / campaign.clicks
      : 0;
    const cpa = campaign.applications > 0
      ? campaign.spent / campaign.applications
      : 0;
    const depositRevenue = campaign.deposits * DEFAULT_DEPOSIT_VALUE;
    const roi = campaign.spent > 0
      ? ((depositRevenue - campaign.spent) / campaign.spent) * 100
      : 0;
    const conversionRate = campaign.clicks > 0
      ? (campaign.applications / campaign.clicks) * 100
      : 0;

    return {
      campaignId: campaign.id,
      campaignName: campaign.name,
      adFormat: campaign.adFormat,
      status: campaign.status,
      startDate: campaign.startDate?.toISOString() ?? null,
      endDate: campaign.endDate?.toISOString() ?? null,
      locationName: campaign.targeting?.locationName ?? null,
      budget: campaign.budget,
      spend: campaign.spent,
      impressions: campaign.impressions,
      clicks: campaign.clicks,
      applications: campaign.applications,
      deposits: campaign.deposits,
      ctr: Math.round(ctr * 100) / 100,
      cpc: Math.round(cpc * 100) / 100,
      cpa: Math.round(cpa * 100) / 100,
      roi: Math.round(roi * 100) / 100,
      conversionRate: Math.round(conversionRate * 100) / 100,
    };
  }

  async getDailyPerformance(
    campaignId: string,
    userId: string,
    days: number = 30,
  ): Promise<DailyPerformance[]> {
    const campaign = await this.db.campaign.findFirst({
      where: { id: campaignId, userId },
    });

    if (!campaign) {
      throw new NotFoundError('Campaign');
    }

    const since = new Date();
    since.setDate(since.getDate() - days);

    const stats = await this.db.campaignDailyStats.findMany({
      where: { campaignId, statDate: { gte: since } },
      orderBy: { statDate: 'asc' },
    });

    return stats.map((s) => ({
      date: s.statDate.toISOString().slice(0, 10),
      impressions: s.impressions,
      clicks: s.clicks,
      applications: s.applications,
      deposits: s.deposits,
      spend: s.spend,
    }));
  }

  async getOverview(userId: string): Promise<{
    totalSpend: number;
    totalImpressions: number;
    totalClicks: number;
    totalApplications: number;
    totalDeposits: number;
    averageCtr: number;
    campaignCount: number;
  }> {
    const campaigns = await this.db.campaign.findMany({
      where: { userId },
      select: {
        impressions: true,
        clicks: true,
        spent: true,
        applications: true,
        deposits: true,
      },
    });

    const totals = campaigns.reduce(
      (acc, c) => ({
        spend: acc.spend + c.spent,
        impressions: acc.impressions + c.impressions,
        clicks: acc.clicks + c.clicks,
        applications: acc.applications + c.applications,
        deposits: acc.deposits + c.deposits,
      }),
      { spend: 0, impressions: 0, clicks: 0, applications: 0, deposits: 0 },
    );

    const avgCtr = totals.impressions > 0
      ? (totals.clicks / totals.impressions) * 100
      : 0;

    return {
      totalSpend: totals.spend,
      totalImpressions: totals.impressions,
      totalClicks: totals.clicks,
      totalApplications: totals.applications,
      totalDeposits: totals.deposits,
      averageCtr: Math.round(avgCtr * 100) / 100,
      campaignCount: campaigns.length,
    };
  }
}
