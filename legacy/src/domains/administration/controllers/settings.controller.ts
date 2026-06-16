import type { Request, Response, NextFunction } from 'express';

import { success } from '../../../infrastructure/http/response.helper';
import type { SettingsService } from '../services/settings.service';

export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  list = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const settings = await this.settingsService.getAll();
      success(res, settings);
    } catch (err) {
      next(err);
    }
  };

  listGrouped = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const grouped = await this.settingsService.getGrouped();
      success(res, grouped);
    } catch (err) {
      next(err);
    }
  };

  show = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const setting = await this.settingsService.getSingle(req.params.key as string);
      success(res, setting);
    } catch (err) {
      next(err);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const adminId = req.user!.sub;
      const ipAddress = req.ip;
      const userAgent = req.get('user-agent');
      const result = await this.settingsService.update(
        req.body.settings,
        adminId,
        ipAddress,
        userAgent,
      );
      success(res, result, 'Settings updated successfully');
    } catch (err) {
      next(err);
    }
  };
}
