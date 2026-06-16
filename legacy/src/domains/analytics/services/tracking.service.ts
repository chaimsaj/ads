import type { Prisma, PrismaClient } from '@prisma/client';

import { createLogger } from '../../../infrastructure/logging/logger';

const logger = createLogger('tracking-service');

type TrackingEventType = 'impression' | 'click' | 'application' | 'deposit';

interface TrackEventInput {
  campaignId: string;
  type: TrackingEventType;
  userId?: string;
  deviceId?: string;
  metadata?: Record<string, unknown>;
}

export class TrackingService {
  constructor(private readonly db: PrismaClient) {}

  async trackEvent(input: TrackEventInput): Promise<void> {
    const { campaignId, type, userId, deviceId, metadata } = input;

    const campaign = await this.db.campaign.findUnique({ where: { id: campaignId } });
    if (!campaign) {
      logger.warn('Tracking event for unknown campaign', { campaignId, type });
      return;
    }

    await this.db.conversionEvent.create({
      data: {
        campaignId,
        type,
        userId,
        deviceId,
        metadata: (metadata as Prisma.InputJsonValue) ?? null,
      },
    });

    await this.updateCampaignCounters(campaignId, type);
    await this.upsertDailyStats(campaignId, type);

    logger.info('Tracking event recorded', { campaignId, type });
  }

  getConversionPixelUrl(campaignId: string, type: 'application' | 'deposit'): string {
    return `/v1/tracking/pixel/${campaignId}.png?type=${type}`;
  }

  private async updateCampaignCounters(campaignId: string, type: TrackingEventType): Promise<void> {
    const incrementData: Record<string, { increment: number }> = {};

    if (type === 'impression') {
      incrementData.impressions = { increment: 1 };
    }
    if (type === 'click') {
      incrementData.clicks = { increment: 1 };
    }
    if (type === 'application') {
      incrementData.applications = { increment: 1 };
      incrementData.conversions = { increment: 1 };
    }
    if (type === 'deposit') {
      incrementData.deposits = { increment: 1 };
    }

    await this.db.campaign.update({
      where: { id: campaignId },
      data: incrementData,
    });
  }

  private async upsertDailyStats(campaignId: string, type: TrackingEventType): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existingDaily = await this.db.campaignDailyStats.findFirst({
      where: { campaignId, statDate: today },
    });

    if (existingDaily) {
      const dailyIncrement: Record<string, { increment: number }> = {};

      if (type === 'impression') {
        dailyIncrement.impressions = { increment: 1 };
      }
      if (type === 'click') {
        dailyIncrement.clicks = { increment: 1 };
      }
      if (type === 'application') {
        dailyIncrement.applications = { increment: 1 };
        dailyIncrement.conversions = { increment: 1 };
      }
      if (type === 'deposit') {
        dailyIncrement.deposits = { increment: 1 };
      }

      await this.db.campaignDailyStats.update({
        where: { id: existingDaily.id },
        data: dailyIncrement,
      });
    } else {
      await this.db.campaignDailyStats.create({
        data: {
          campaignId,
          statDate: today,
          impressions: type === 'impression' ? 1 : 0,
          clicks: type === 'click' ? 1 : 0,
          conversions: type === 'application' ? 1 : 0,
          applications: type === 'application' ? 1 : 0,
          deposits: type === 'deposit' ? 1 : 0,
          spend: 0,
        },
      });
    }
  }
}
