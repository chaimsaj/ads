import type { PrismaClient } from '@prisma/client';

import type {
  IDashboardRepository,
  RawRevenueSeries,
  RawUserGrowth,
  StatusCount,
} from '../interfaces/dashboard-repository.interface';
import type { DashboardPeriod } from '../types/analytics.types';

function formatDateToPeriod(date: Date, period: DashboardPeriod): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');

  switch (period) {
    case 'day':
      return `${y}-${m}-${d}`;
    case 'week': {
      const jan1 = new Date(y, 0, 1);
      const days = Math.floor((date.getTime() - jan1.getTime()) / 86400000);
      const week = String(Math.ceil((days + jan1.getDay() + 1) / 7)).padStart(2, '0');
      return `${y}-W${week}`;
    }
    case 'month':
      return `${y}-${m}`;
    case 'year':
      return `${y}`;
  }
}

export class DashboardRepository implements IDashboardRepository {
  constructor(private readonly db: PrismaClient) {}

  async getTotalUsersCount(): Promise<number> {
    return this.db.user.count({
      where: { deletedAt: null },
    });
  }

  async getNewUsersCount(since: Date): Promise<number> {
    return this.db.user.count({
      where: { deletedAt: null, createdAt: { gte: since } },
    });
  }

  async getActiveCampaignsCount(): Promise<number> {
    return this.db.campaign.count({
      where: { status: 'ACTIVE', deletedAt: null },
    });
  }

  async getTotalCampaignsCount(): Promise<number> {
    return this.db.campaign.count({
      where: { deletedAt: null },
    });
  }

  async getTotalRevenue(): Promise<number> {
    const result = await this.db.transaction.aggregate({
      where: { type: 'CHARGE', status: 'COMPLETED' },
      _sum: { amount: true },
    });
    return result._sum.amount ?? 0;
  }

  async getRevenuesSince(since: Date): Promise<number> {
    const result = await this.db.transaction.aggregate({
      where: { type: 'CHARGE', status: 'COMPLETED', createdAt: { gte: since } },
      _sum: { amount: true },
    });
    return result._sum.amount ?? 0;
  }

  async getTotalImpressions(): Promise<number> {
    const result = await this.db.campaign.aggregate({
      where: { deletedAt: null },
      _sum: { impressions: true },
    });
    return result._sum.impressions ?? 0;
  }

  async getTotalClicks(): Promise<number> {
    const result = await this.db.campaign.aggregate({
      where: { deletedAt: null },
      _sum: { clicks: true },
    });
    return result._sum.clicks ?? 0;
  }

  async getRevenueTimeSeries(period: DashboardPeriod, since: Date): Promise<readonly RawRevenueSeries[]> {
    const transactions = await this.db.transaction.findMany({
      where: { type: 'CHARGE', status: 'COMPLETED', createdAt: { gte: since } },
      select: { amount: true, createdAt: true },
    });

    const grouped = new Map<string, { revenue: number; transactions: number }>();

    for (const tx of transactions) {
      const key = formatDateToPeriod(tx.createdAt, period);
      const existing = grouped.get(key) ?? { revenue: 0, transactions: 0 };
      grouped.set(key, {
        revenue: existing.revenue + tx.amount,
        transactions: existing.transactions + 1,
      });
    }

    return Array.from(grouped.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([p, data]) => ({
        period: p,
        revenue: data.revenue,
        transactions: data.transactions,
      }));
  }

  async getCampaignStatusDistribution(): Promise<readonly StatusCount[]> {
    const result = await this.db.campaign.groupBy({
      by: ['status'],
      where: { deletedAt: null },
      _count: true,
    });
    return result.map((r) => ({ status: r.status, count: r._count }));
  }

  async getUserGrowth(period: DashboardPeriod, since: Date): Promise<readonly RawUserGrowth[]> {
    const users = await this.db.user.findMany({
      where: { deletedAt: null, createdAt: { gte: since } },
      select: { createdAt: true },
    });

    const grouped = new Map<string, number>();

    for (const user of users) {
      const key = formatDateToPeriod(user.createdAt, period);
      grouped.set(key, (grouped.get(key) ?? 0) + 1);
    }

    return Array.from(grouped.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([p, count]) => ({
        period: p,
        newUsers: count,
      }));
  }
}
