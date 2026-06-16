import { describe, it, expect, vi, beforeEach } from 'vitest';
import type {
  User,
  NotificationSetting,
  UserStatus,
  UserRole,
} from '@prisma/client';

import type { IUserProfileRepository } from '../../interfaces/user-profile-repository.interface';
import type { INotificationSettingRepository } from '../../interfaces/notification-setting-repository.interface';
import type { IPasswordService } from '../../../identity/interfaces/password-service.interface';
import { UserProfileService } from '../user-profile.service';
import { mockObjectId } from '../../../../../tests/helpers/objectid-helper';

// ---- Mock Factories ----

function createMockUser(overrides: Partial<User> = {}): User {
  return {
    id: mockObjectId(1),
    name: 'John Doe',
    email: 'john@example.com',
    password: '$2b$10$hashedpassword',
    phone: '+1234567890',
    company: 'Acme Inc',
    avatar: 'avatar.png',
    emailVerifiedAt: new Date('2025-01-01'),
    verificationCode: null,
    verificationCodeExpiresAt: null,
    passwordResetToken: null,
    passwordResetExpiresAt: null,
    status: 'ACTIVE' as UserStatus,
    role: 'ADVERTISER' as UserRole,
    failedLoginAttempts: 0,
    lockedUntil: null,
    lastLoginAt: new Date('2025-06-01'),
    lastLoginIp: '127.0.0.1',
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-06-01'),
    deletedAt: null,
    ...overrides,
  };
}

function createMockNotificationSetting(
  overrides: Partial<NotificationSetting> = {},
): NotificationSetting {
  return {
    id: mockObjectId(1),
    userId: mockObjectId(1),
    emailCampaignUpdates: true,
    emailWeeklyReports: true,
    emailBillingAlerts: true,
    emailProductNews: false,
    pushCampaignUpdates: true,
    pushBillingAlerts: true,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-06-01'),
    ...overrides,
  };
}

// ---- Mock Repository / Service Factories ----

function createMockUserRepo(): IUserProfileRepository {
  return {
    findById: vi.fn().mockResolvedValue(null),
    updateProfile: vi.fn().mockResolvedValue(createMockUser()),
    updateAvatar: vi.fn().mockResolvedValue(createMockUser()),
    updatePassword: vi.fn().mockResolvedValue(createMockUser()),
    softDelete: vi.fn().mockResolvedValue(undefined),
  };
}

function createMockNotificationRepo(): INotificationSettingRepository {
  return {
    findByUserId: vi.fn().mockResolvedValue(null),
    createDefault: vi.fn().mockResolvedValue(createMockNotificationSetting()),
    upsert: vi.fn().mockResolvedValue(createMockNotificationSetting()),
  };
}

function createMockPasswordService(): IPasswordService {
  return {
    hash: vi.fn().mockResolvedValue('$2b$10$newhashedpassword'),
    compare: vi.fn().mockResolvedValue(true),
  };
}

// ---- Tests ----

describe('UserProfileService', () => {
  let service: UserProfileService;
  let userRepo: IUserProfileRepository;
  let notificationRepo: INotificationSettingRepository;
  let passwordService: IPasswordService;

  beforeEach(() => {
    userRepo = createMockUserRepo();
    notificationRepo = createMockNotificationRepo();
    passwordService = createMockPasswordService();
    service = new UserProfileService(userRepo, notificationRepo, passwordService);
  });

  describe('getProfile', () => {
    it('should return user profile DTO when user exists', async () => {
      const mockUser = createMockUser();
      (userRepo.findById as ReturnType<typeof vi.fn>).mockResolvedValue(mockUser);

      const result = await service.getProfile(mockObjectId(1));

      expect(result.id).toBe(mockObjectId(1));
      expect(result.name).toBe('John Doe');
      expect(result.email).toBe('john@example.com');
      expect(result.phone).toBe('+1234567890');
      expect(result.company).toBe('Acme Inc');
      expect(result.avatar).toBe('avatar.png');
      expect(result.status).toBe('active');
      expect(result.role).toBe('advertiser');
      expect(result.emailVerified).toBe(true);
      expect(result.lastLoginAt).toEqual(mockUser.lastLoginAt);
      expect(result.createdAt).toEqual(mockUser.createdAt);
      expect(userRepo.findById).toHaveBeenCalledWith(mockObjectId(1));
    });

    it('should throw NotFoundError when user does not exist', async () => {
      await expect(service.getProfile(mockObjectId(999))).rejects.toThrow('User not found');
    });
  });

  describe('updateProfile', () => {
    it('should update and return user profile DTO', async () => {
      const existingUser = createMockUser();
      const updatedUser = createMockUser({ name: 'Jane Doe', company: 'New Corp' });

      (userRepo.findById as ReturnType<typeof vi.fn>).mockResolvedValue(existingUser);
      (userRepo.updateProfile as ReturnType<typeof vi.fn>).mockResolvedValue(updatedUser);

      const result = await service.updateProfile(mockObjectId(1), { name: 'Jane Doe', company: 'New Corp' });

      expect(result.name).toBe('Jane Doe');
      expect(result.company).toBe('New Corp');
      expect(userRepo.findById).toHaveBeenCalledWith(mockObjectId(1));
      expect(userRepo.updateProfile).toHaveBeenCalledWith(mockObjectId(1), {
        name: 'Jane Doe',
        company: 'New Corp',
      });
    });

    it('should throw NotFoundError when user does not exist', async () => {
      await expect(
        service.updateProfile(mockObjectId(999), { name: 'Nobody' }),
      ).rejects.toThrow('User not found');
    });
  });

  describe('updateAvatar', () => {
    it('should update avatar and return user profile DTO', async () => {
      const existingUser = createMockUser();
      const updatedUser = createMockUser({ avatar: 'new-avatar.png' });

      (userRepo.findById as ReturnType<typeof vi.fn>).mockResolvedValue(existingUser);
      (userRepo.updateAvatar as ReturnType<typeof vi.fn>).mockResolvedValue(updatedUser);

      const result = await service.updateAvatar(mockObjectId(1), 'new-avatar.png');

      expect(result.avatar).toBe('new-avatar.png');
      expect(userRepo.findById).toHaveBeenCalledWith(mockObjectId(1));
      expect(userRepo.updateAvatar).toHaveBeenCalledWith(mockObjectId(1), 'new-avatar.png');
    });

    it('should throw NotFoundError when user does not exist', async () => {
      await expect(
        service.updateAvatar(mockObjectId(999), 'avatar.png'),
      ).rejects.toThrow('User not found');
    });
  });

  describe('changePassword', () => {
    it('should change password when current password is correct', async () => {
      const mockUser = createMockUser();
      (userRepo.findById as ReturnType<typeof vi.fn>).mockResolvedValue(mockUser);
      (passwordService.compare as ReturnType<typeof vi.fn>).mockResolvedValue(true);
      (passwordService.hash as ReturnType<typeof vi.fn>).mockResolvedValue('$2b$10$newhash');

      await service.changePassword(mockObjectId(1), 'oldPassword123', 'newPassword456');

      expect(userRepo.findById).toHaveBeenCalledWith(mockObjectId(1));
      expect(passwordService.compare).toHaveBeenCalledWith(
        'oldPassword123',
        '$2b$10$hashedpassword',
      );
      expect(passwordService.hash).toHaveBeenCalledWith('newPassword456');
      expect(userRepo.updatePassword).toHaveBeenCalledWith(mockObjectId(1), '$2b$10$newhash');
    });

    it('should throw ValidationError when current password is incorrect', async () => {
      const mockUser = createMockUser();
      (userRepo.findById as ReturnType<typeof vi.fn>).mockResolvedValue(mockUser);
      (passwordService.compare as ReturnType<typeof vi.fn>).mockResolvedValue(false);

      await expect(
        service.changePassword(mockObjectId(1), 'wrongPassword', 'newPassword456'),
      ).rejects.toThrow('Validation failed');

      expect(passwordService.hash).not.toHaveBeenCalled();
      expect(userRepo.updatePassword).not.toHaveBeenCalled();
    });

    it('should throw NotFoundError when user does not exist', async () => {
      await expect(
        service.changePassword(mockObjectId(999), 'oldPassword', 'newPassword'),
      ).rejects.toThrow('User not found');

      expect(passwordService.compare).not.toHaveBeenCalled();
      expect(passwordService.hash).not.toHaveBeenCalled();
      expect(userRepo.updatePassword).not.toHaveBeenCalled();
    });
  });

  describe('deleteAccount', () => {
    it('should soft-delete user account', async () => {
      const mockUser = createMockUser();
      (userRepo.findById as ReturnType<typeof vi.fn>).mockResolvedValue(mockUser);

      await service.deleteAccount(mockObjectId(1));

      expect(userRepo.findById).toHaveBeenCalledWith(mockObjectId(1));
      expect(userRepo.softDelete).toHaveBeenCalledWith(mockObjectId(1));
    });

    it('should throw NotFoundError when user does not exist', async () => {
      await expect(service.deleteAccount(mockObjectId(999))).rejects.toThrow('User not found');

      expect(userRepo.softDelete).not.toHaveBeenCalled();
    });
  });

  describe('getNotificationSettings', () => {
    it('should return existing notification settings', async () => {
      const mockSettings = createMockNotificationSetting();
      (notificationRepo.findByUserId as ReturnType<typeof vi.fn>).mockResolvedValue(mockSettings);

      const result = await service.getNotificationSettings(mockObjectId(1));

      expect(result.emailCampaignUpdates).toBe(true);
      expect(result.emailWeeklyReports).toBe(true);
      expect(result.emailBillingAlerts).toBe(true);
      expect(result.emailProductNews).toBe(false);
      expect(result.pushCampaignUpdates).toBe(true);
      expect(result.pushBillingAlerts).toBe(true);
      expect(notificationRepo.findByUserId).toHaveBeenCalledWith(mockObjectId(1));
      expect(notificationRepo.createDefault).not.toHaveBeenCalled();
    });

    it('should create default settings when none exist', async () => {
      (notificationRepo.findByUserId as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      const result = await service.getNotificationSettings(mockObjectId(1));

      expect(result.emailCampaignUpdates).toBe(true);
      expect(result.pushBillingAlerts).toBe(true);
      expect(notificationRepo.findByUserId).toHaveBeenCalledWith(mockObjectId(1));
      expect(notificationRepo.createDefault).toHaveBeenCalledWith(mockObjectId(1));
    });
  });

  describe('updateNotificationSettings', () => {
    it('should upsert and return notification settings DTO', async () => {
      const updatedSettings = createMockNotificationSetting({
        emailProductNews: true,
        pushCampaignUpdates: false,
      });
      (notificationRepo.upsert as ReturnType<typeof vi.fn>).mockResolvedValue(updatedSettings);

      const updateData = { emailProductNews: true, pushCampaignUpdates: false };
      const result = await service.updateNotificationSettings(mockObjectId(1), updateData);

      expect(result.emailProductNews).toBe(true);
      expect(result.pushCampaignUpdates).toBe(false);
      expect(result.emailCampaignUpdates).toBe(true);
      expect(notificationRepo.upsert).toHaveBeenCalledWith(mockObjectId(1), updateData);
    });
  });
});
