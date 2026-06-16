import type { Request, Response, NextFunction } from 'express';

import { success } from '../../../infrastructure/http/response.helper';
import type { EmailAdminService } from '../services/email-admin.service';

export class EmailAdminController {
  constructor(private readonly adminService: EmailAdminService) {}

  stats = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = this.adminService.getStats();
      success(res, data);
    } catch (err) {
      next(err);
    }
  };

  recent = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = this.adminService.getStats();
      success(res, data.recentEmails);
    } catch (err) {
      next(err);
    }
  };

  sendBulk = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.adminService.sendBulk(req.body);
      success(res, result, `Bulk email completed: ${result.sent} sent, ${result.failed} failed`);
    } catch (err) {
      next(err);
    }
  };
}
