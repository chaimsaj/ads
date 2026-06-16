import type { NotificationSetting, PrismaClient } from '@prisma/client';

import type {
  INotificationSettingRepository,
  NotificationSettingUpdateData,
} from '../interfaces/notification-setting-repository.interface';

export class NotificationSettingRepository implements INotificationSettingRepository {
  constructor(private readonly db: PrismaClient) {}

  async findByUserId(userId: string): Promise<NotificationSetting | null> {
    return this.db.notificationSetting.findUnique({
      where: { userId },
    });
  }

  async createDefault(userId: string): Promise<NotificationSetting> {
    return this.db.notificationSetting.create({
      data: {
        userId,
        emailCampaignUpdates: true,
        emailWeeklyReports: true,
        emailBillingAlerts: true,
        emailProductNews: false,
        pushCampaignUpdates: true,
        pushBillingAlerts: true,
      },
    });
  }

  async upsert(userId: string, data: NotificationSettingUpdateData): Promise<NotificationSetting> {
    return this.db.notificationSetting.upsert({
      where: { userId },
      update: {
        ...(data.emailCampaignUpdates !== undefined && { emailCampaignUpdates: data.emailCampaignUpdates }),
        ...(data.emailWeeklyReports !== undefined && { emailWeeklyReports: data.emailWeeklyReports }),
        ...(data.emailBillingAlerts !== undefined && { emailBillingAlerts: data.emailBillingAlerts }),
        ...(data.emailProductNews !== undefined && { emailProductNews: data.emailProductNews }),
        ...(data.pushCampaignUpdates !== undefined && { pushCampaignUpdates: data.pushCampaignUpdates }),
        ...(data.pushBillingAlerts !== undefined && { pushBillingAlerts: data.pushBillingAlerts }),
      },
      create: {
        userId,
        emailCampaignUpdates: data.emailCampaignUpdates ?? true,
        emailWeeklyReports: data.emailWeeklyReports ?? true,
        emailBillingAlerts: data.emailBillingAlerts ?? true,
        emailProductNews: data.emailProductNews ?? false,
        pushCampaignUpdates: data.pushCampaignUpdates ?? true,
        pushBillingAlerts: data.pushBillingAlerts ?? true,
      },
    });
  }
}
