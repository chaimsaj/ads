import type { PrismaClient } from '@prisma/client';

export class CascadeService {
  constructor(private readonly db: PrismaClient) {}

  async deleteUserCascade(userId: string): Promise<void> {
    const pendingTransactions = await this.db.transaction.count({
      where: { userId, status: 'PENDING' },
    });

    if (pendingTransactions > 0) {
      throw new Error('Cannot delete user with pending transactions');
    }

    await this.db.$transaction(async (tx) => {
      const campaigns = await tx.campaign.findMany({
        where: { userId },
        select: { id: true },
      });
      const campaignIds = campaigns.map((c) => c.id);

      if (campaignIds.length > 0) {
        await tx.campaignDailyStats.deleteMany({
          where: { campaignId: { in: campaignIds } },
        });
        await tx.campaignTargeting.deleteMany({
          where: { campaignId: { in: campaignIds } },
        });
        await tx.transaction.updateMany({
          where: { campaignId: { in: campaignIds } },
          data: { campaignId: null },
        });
        await tx.campaign.deleteMany({
          where: { userId },
        });
      }

      await tx.transaction.updateMany({
        where: { userId },
        data: { paymentMethodId: null },
      });
      await tx.paymentMethod.deleteMany({
        where: { userId },
      });
      await tx.notificationSetting.deleteMany({
        where: { userId },
      });
      await tx.refreshToken.deleteMany({
        where: { userId },
      });
      await tx.user.delete({
        where: { id: userId },
      });
    });
  }

  async deleteCampaignCascade(campaignId: string): Promise<void> {
    await this.db.$transaction(async (tx) => {
      await tx.campaignDailyStats.deleteMany({
        where: { campaignId },
      });
      await tx.campaignTargeting.deleteMany({
        where: { campaignId },
      });
      await tx.transaction.updateMany({
        where: { campaignId },
        data: { campaignId: null },
      });
      await tx.campaign.delete({
        where: { id: campaignId },
      });
    });
  }
}
