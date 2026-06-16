import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request, Response, NextFunction } from 'express';

import { UserController } from '../user.controller';
import type { UserProfileService } from '../../services/user-profile.service';
import { mockObjectId } from '../../../../../tests/helpers/objectid-helper';

// Mock the response helper module
vi.mock('../../../../infrastructure/http/response.helper', () => ({
  success: vi.fn(),
  noContent: vi.fn(),
}));

import { success, noContent } from '../../../../infrastructure/http/response.helper';

describe('UserController', () => {
  let controller: UserController;
  let mockProfileService: Partial<UserProfileService>;
  let mockReq: Request;
  let mockRes: Response;
  let mockNext: NextFunction;

  const mockProfile = {
    id: mockObjectId(1),
    name: 'Test User',
    email: 'test@example.com',
    phone: '1234567890',
    company: 'Test Corp',
    avatar: null,
  };

  const mockNotificationSettings = {
    emailCampaignUpdates: true,
    emailBillingAlerts: true,
    emailMarketingTips: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();

    mockProfileService = {
      getProfile: vi.fn(),
      updateProfile: vi.fn(),
      updateAvatar: vi.fn(),
      changePassword: vi.fn(),
      deleteAccount: vi.fn(),
      getNotificationSettings: vi.fn(),
      updateNotificationSettings: vi.fn(),
    };

    mockReq = {
      body: {},
      params: {},
      user: { sub: mockObjectId(1), email: 'test@example.com', role: 'advertiser', type: 'access' },
    } as unknown as Request;

    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    } as unknown as Response;

    mockNext = vi.fn();

    controller = new UserController(mockProfileService as UserProfileService);
  });

  describe('profile', () => {
    it('should call profileService.getProfile with user id', async () => {
      vi.mocked(mockProfileService.getProfile!).mockResolvedValue(mockProfile);

      await controller.profile(mockReq, mockRes, mockNext);

      expect(mockProfileService.getProfile).toHaveBeenCalledWith(mockObjectId(1));
    });

    it('should call success helper on success', async () => {
      vi.mocked(mockProfileService.getProfile!).mockResolvedValue(mockProfile);

      await controller.profile(mockReq, mockRes, mockNext);

      expect(success).toHaveBeenCalledWith(mockRes, mockProfile);
    });

    it('should call next with error on failure', async () => {
      const error = new Error('User not found');
      vi.mocked(mockProfileService.getProfile!).mockRejectedValue(error);

      await controller.profile(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('updateProfile', () => {
    const updateData = {
      name: 'Updated Name',
      phone: '9876543210',
    };

    it('should call profileService.updateProfile with user id and body', async () => {
      mockReq.body = updateData;
      vi.mocked(mockProfileService.updateProfile!).mockResolvedValue({ ...mockProfile, ...updateData });

      await controller.updateProfile(mockReq, mockRes, mockNext);

      expect(mockProfileService.updateProfile).toHaveBeenCalledWith(mockObjectId(1), updateData);
    });

    it('should call success helper with message on success', async () => {
      mockReq.body = updateData;
      const updatedProfile = { ...mockProfile, ...updateData };
      vi.mocked(mockProfileService.updateProfile!).mockResolvedValue(updatedProfile);

      await controller.updateProfile(mockReq, mockRes, mockNext);

      expect(success).toHaveBeenCalledWith(mockRes, updatedProfile, 'Profile updated');
    });

    it('should call next with error on failure', async () => {
      mockReq.body = updateData;
      const error = new Error('Update failed');
      vi.mocked(mockProfileService.updateProfile!).mockRejectedValue(error);

      await controller.updateProfile(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('updateAvatar', () => {
    it('should call profileService.updateAvatar with user id and filename', async () => {
      (mockReq as Request & { file?: Express.Multer.File }).file = {
        filename: 'avatar-123.jpg',
      } as Express.Multer.File;
      vi.mocked(mockProfileService.updateAvatar!).mockResolvedValue({
        ...mockProfile,
        avatar: 'avatar-123.jpg',
      });

      await controller.updateAvatar(mockReq, mockRes, mockNext);

      expect(mockProfileService.updateAvatar).toHaveBeenCalledWith(mockObjectId(1), 'avatar-123.jpg');
    });

    it('should call success helper with message on success', async () => {
      (mockReq as Request & { file?: Express.Multer.File }).file = {
        filename: 'avatar-123.jpg',
      } as Express.Multer.File;
      const updatedProfile = { ...mockProfile, avatar: 'avatar-123.jpg' };
      vi.mocked(mockProfileService.updateAvatar!).mockResolvedValue(updatedProfile);

      await controller.updateAvatar(mockReq, mockRes, mockNext);

      expect(success).toHaveBeenCalledWith(mockRes, updatedProfile, 'Avatar updated');
    });

    it('should return 400 when no file uploaded', async () => {
      (mockReq as Request & { file?: Express.Multer.File }).file = undefined;

      await controller.updateAvatar(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'No file uploaded',
      });
    });

    it('should call next with error on failure', async () => {
      (mockReq as Request & { file?: Express.Multer.File }).file = {
        filename: 'avatar-123.jpg',
      } as Express.Multer.File;
      const error = new Error('Upload failed');
      vi.mocked(mockProfileService.updateAvatar!).mockRejectedValue(error);

      await controller.updateAvatar(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('changePassword', () => {
    const passwordData = {
      currentPassword: 'oldpassword123',
      newPassword: 'newpassword123',
    };

    it('should call profileService.changePassword with correct parameters', async () => {
      mockReq.body = passwordData;
      vi.mocked(mockProfileService.changePassword!).mockResolvedValue();

      await controller.changePassword(mockReq, mockRes, mockNext);

      expect(mockProfileService.changePassword).toHaveBeenCalledWith(
        mockObjectId(1),
        'oldpassword123',
        'newpassword123',
      );
    });

    it('should call noContent helper on success', async () => {
      mockReq.body = passwordData;
      vi.mocked(mockProfileService.changePassword!).mockResolvedValue();

      await controller.changePassword(mockReq, mockRes, mockNext);

      expect(noContent).toHaveBeenCalledWith(mockRes);
    });

    it('should call next with error on failure', async () => {
      mockReq.body = passwordData;
      const error = new Error('Current password incorrect');
      vi.mocked(mockProfileService.changePassword!).mockRejectedValue(error);

      await controller.changePassword(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('deleteAccount', () => {
    it('should call profileService.deleteAccount with user id', async () => {
      vi.mocked(mockProfileService.deleteAccount!).mockResolvedValue();

      await controller.deleteAccount(mockReq, mockRes, mockNext);

      expect(mockProfileService.deleteAccount).toHaveBeenCalledWith(mockObjectId(1));
    });

    it('should call noContent helper on success', async () => {
      vi.mocked(mockProfileService.deleteAccount!).mockResolvedValue();

      await controller.deleteAccount(mockReq, mockRes, mockNext);

      expect(noContent).toHaveBeenCalledWith(mockRes);
    });

    it('should call next with error on failure', async () => {
      const error = new Error('Cannot delete account with active campaigns');
      vi.mocked(mockProfileService.deleteAccount!).mockRejectedValue(error);

      await controller.deleteAccount(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('notificationSettings', () => {
    it('should call profileService.getNotificationSettings with user id', async () => {
      vi.mocked(mockProfileService.getNotificationSettings!).mockResolvedValue(mockNotificationSettings);

      await controller.notificationSettings(mockReq, mockRes, mockNext);

      expect(mockProfileService.getNotificationSettings).toHaveBeenCalledWith(mockObjectId(1));
    });

    it('should call success helper on success', async () => {
      vi.mocked(mockProfileService.getNotificationSettings!).mockResolvedValue(mockNotificationSettings);

      await controller.notificationSettings(mockReq, mockRes, mockNext);

      expect(success).toHaveBeenCalledWith(mockRes, mockNotificationSettings);
    });

    it('should call next with error on failure', async () => {
      const error = new Error('Failed to fetch settings');
      vi.mocked(mockProfileService.getNotificationSettings!).mockRejectedValue(error);

      await controller.notificationSettings(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('updateNotificationSettings', () => {
    const settingsData = {
      emailCampaignUpdates: false,
      emailMarketingTips: true,
    };

    it('should call profileService.updateNotificationSettings with user id and body', async () => {
      mockReq.body = settingsData;
      vi.mocked(mockProfileService.updateNotificationSettings!).mockResolvedValue({
        ...mockNotificationSettings,
        ...settingsData,
      });

      await controller.updateNotificationSettings(mockReq, mockRes, mockNext);

      expect(mockProfileService.updateNotificationSettings).toHaveBeenCalledWith(mockObjectId(1), settingsData);
    });

    it('should call success helper with message on success', async () => {
      mockReq.body = settingsData;
      const updatedSettings = { ...mockNotificationSettings, ...settingsData };
      vi.mocked(mockProfileService.updateNotificationSettings!).mockResolvedValue(updatedSettings);

      await controller.updateNotificationSettings(mockReq, mockRes, mockNext);

      expect(success).toHaveBeenCalledWith(mockRes, updatedSettings, 'Notification settings updated');
    });

    it('should call next with error on failure', async () => {
      mockReq.body = settingsData;
      const error = new Error('Failed to update settings');
      vi.mocked(mockProfileService.updateNotificationSettings!).mockRejectedValue(error);

      await controller.updateNotificationSettings(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('user context', () => {
    it('should use correct user id from request for all operations', async () => {
      mockReq.user = { sub: mockObjectId(42), email: 'other@example.com', role: 'advertiser', type: 'access' };
      vi.mocked(mockProfileService.getProfile!).mockResolvedValue(mockProfile);

      await controller.profile(mockReq, mockRes, mockNext);

      expect(mockProfileService.getProfile).toHaveBeenCalledWith(mockObjectId(42));
    });
  });
});
