import type { Request, Response, NextFunction } from 'express';

import { success, noContent } from '../../../infrastructure/http/response.helper';
import type { UserProfileService } from '../services/user-profile.service';

export class UserController {
  constructor(private readonly profileService: UserProfileService) {}

  search = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const query = String(req.query.q || '').trim();
      if (query.length < 2) {
        success(res, []);
        return;
      }
      const results = await this.profileService.searchUsers(query, 10);
      success(res, results);
    } catch (err) {
      next(err);
    }
  };

  profile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.profileService.getProfile(req.user!.sub);
      success(res, result);
    } catch (err) {
      next(err);
    }
  };

  updateProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.profileService.updateProfile(req.user!.sub, req.body);
      success(res, result, 'Profile updated');
    } catch (err) {
      next(err);
    }
  };

  updateAvatar = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const file = (req as Request & { file?: Express.Multer.File }).file;
      if (!file) {
        res.status(400).json({ success: false, error: 'No file uploaded' });
        return;
      }
      const result = await this.profileService.updateAvatar(req.user!.sub, file.filename);
      success(res, result, 'Avatar updated');
    } catch (err) {
      next(err);
    }
  };

  changePassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.profileService.changePassword(
        req.user!.sub,
        req.body.currentPassword,
        req.body.newPassword,
      );
      noContent(res);
    } catch (err) {
      next(err);
    }
  };

  deleteAccount = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.profileService.deleteAccount(req.user!.sub);
      noContent(res);
    } catch (err) {
      next(err);
    }
  };

  notificationSettings = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.profileService.getNotificationSettings(req.user!.sub);
      success(res, result);
    } catch (err) {
      next(err);
    }
  };

  updateNotificationSettings = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.profileService.updateNotificationSettings(req.user!.sub, req.body);
      success(res, result, 'Notification settings updated');
    } catch (err) {
      next(err);
    }
  };
}
