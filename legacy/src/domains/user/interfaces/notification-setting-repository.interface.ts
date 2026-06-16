import type { NotificationSetting } from '@prisma/client';

export interface INotificationSettingRepository {
  findByUserId(userId: string): Promise<NotificationSetting | null>;
  createDefault(userId: string): Promise<NotificationSetting>;
  upsert(userId: string, data: NotificationSettingUpdateData): Promise<NotificationSetting>;
}

export interface NotificationSettingUpdateData {
  readonly emailCampaignUpdates?: boolean;
  readonly emailWeeklyReports?: boolean;
  readonly emailBillingAlerts?: boolean;
  readonly emailProductNews?: boolean;
  readonly pushCampaignUpdates?: boolean;
  readonly pushBillingAlerts?: boolean;
}
