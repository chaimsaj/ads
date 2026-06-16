import type { Request, Response, NextFunction } from 'express';

import { success } from '../../../infrastructure/http/response.helper';
import type { DashboardPeriod } from '../types/analytics.types';
import type { DashboardService } from '../services/dashboard.service';

export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  stats = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await this.dashboardService.getStats();
      success(res, data);
    } catch (err) {
      next(err);
    }
  };

  revenue = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { period } = req.query as { period: DashboardPeriod };
      const data = await this.dashboardService.getRevenue(period);
      success(res, data);
    } catch (err) {
      next(err);
    }
  };

  campaigns = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await this.dashboardService.getCampaignDistribution();
      success(res, data);
    } catch (err) {
      next(err);
    }
  };

  users = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { period } = req.query as { period: DashboardPeriod };
      const data = await this.dashboardService.getUserGrowth(period);
      success(res, data);
    } catch (err) {
      next(err);
    }
  };
}
