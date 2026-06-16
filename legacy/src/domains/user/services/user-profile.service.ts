import { mapEnum } from '../../../infrastructure/utils/enum-mapper';
import { NotFoundError } from '../../../infrastructure/errors';
import type { IPasswordService } from '../../identity/interfaces/password-service.interface';
import type { INotificationSettingRepository } from '../interfaces/notification-setting-repository.interface';
import type { IUserProfileRepository } from '../interfaces/user-profile-repository.interface';
import type {
  UserProfileDTO,
  UserSearchResultDTO,
  UpdateProfileData,
  NotificationSettingDTO,
  UpdateNotificationSettingData,
} from '../types/user.types';

export class UserProfileService {
  constructor(
    private readonly userRepo: IUserProfileRepository,
    private readonly notificationRepo: INotificationSettingRepository,
    private readonly passwordService: IPasswordService,
  ) {}

  async searchUsers(query: string, limit = 10): Promise<UserSearchResultDTO[]> {
    const users = await this.userRepo.searchByName(query, limit);
    return users.map((u) => ({
      id: u.id,
      name: u.name,
      company: u.company,
      avatar: u.avatar,
    }));
  }

  async getProfile(userId: string): Promise<UserProfileDTO> {
    const user = await this.userRepo.findById(userId);

    if (!user) {
      throw new NotFoundError('User');
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      company: user.company,
      avatar: user.avatar,
      status: mapEnum(user.status),
      role: mapEnum(user.role),
      emailVerified: !!user.emailVerifiedAt,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
    };
  }

  async updateProfile(userId: string, data: UpdateProfileData): Promise<UserProfileDTO> {
    const user = await this.userRepo.findById(userId);

    if (!user) {
      throw new NotFoundError('User');
    }

    const updated = await this.userRepo.updateProfile(userId, data);

    return {
      id: updated.id,
      name: updated.name,
      email: updated.email,
      phone: updated.phone,
      company: updated.company,
      avatar: updated.avatar,
      status: mapEnum(updated.status),
      role: mapEnum(updated.role),
      emailVerified: !!updated.emailVerifiedAt,
      lastLoginAt: updated.lastLoginAt,
      createdAt: updated.createdAt,
    };
  }

  async updateAvatar(userId: string, filename: string): Promise<UserProfileDTO> {
    const user = await this.userRepo.findById(userId);

    if (!user) {
      throw new NotFoundError('User');
    }

    const updated = await this.userRepo.updateAvatar(userId, filename);

    return {
      id: updated.id,
      name: updated.name,
      email: updated.email,
      phone: updated.phone,
      company: updated.company,
      avatar: updated.avatar,
      status: mapEnum(updated.status),
      role: mapEnum(updated.role),
      emailVerified: !!updated.emailVerifiedAt,
      lastLoginAt: updated.lastLoginAt,
      createdAt: updated.createdAt,
    };
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    const user = await this.userRepo.findById(userId);

    if (!user) {
      throw new NotFoundError('User');
    }

    const isValid = await this.passwordService.compare(currentPassword, user.password);

    if (!isValid) {
      const { ValidationError } = await import('../../../infrastructure/errors');
      throw new ValidationError([
        { field: 'currentPassword', message: 'Current password is incorrect' },
      ]);
    }

    const hashedPassword = await this.passwordService.hash(newPassword);
    await this.userRepo.updatePassword(userId, hashedPassword);
  }

  async deleteAccount(userId: string): Promise<void> {
    const user = await this.userRepo.findById(userId);

    if (!user) {
      throw new NotFoundError('User');
    }

    await this.userRepo.softDelete(userId);
  }

  async getNotificationSettings(userId: string): Promise<NotificationSettingDTO> {
    let settings = await this.notificationRepo.findByUserId(userId);

    if (!settings) {
      settings = await this.notificationRepo.createDefault(userId);
    }

    return {
      emailCampaignUpdates: settings.emailCampaignUpdates,
      emailWeeklyReports: settings.emailWeeklyReports,
      emailBillingAlerts: settings.emailBillingAlerts,
      emailProductNews: settings.emailProductNews,
      pushCampaignUpdates: settings.pushCampaignUpdates,
      pushBillingAlerts: settings.pushBillingAlerts,
    };
  }

  async updateNotificationSettings(
    userId: string,
    data: UpdateNotificationSettingData,
  ): Promise<NotificationSettingDTO> {
    const settings = await this.notificationRepo.upsert(userId, data);

    return {
      emailCampaignUpdates: settings.emailCampaignUpdates,
      emailWeeklyReports: settings.emailWeeklyReports,
      emailBillingAlerts: settings.emailBillingAlerts,
      emailProductNews: settings.emailProductNews,
      pushCampaignUpdates: settings.pushCampaignUpdates,
      pushBillingAlerts: settings.pushBillingAlerts,
    };
  }
}
