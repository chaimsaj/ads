import type { Request, Response, NextFunction } from 'express';

import { success } from '../../../infrastructure/http/response.helper';
import type { CampaignPerformanceService } from '../services/campaign-performance.service';

export class CampaignPerformanceController {
  constructor(private readonly performanceService: CampaignPerformanceService) {}

  getSummary = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const campaignId = req.params.id as string;
      const userId = req.user!.sub;
      const result = await this.performanceService.getSummary(campaignId, userId);
      success(res, result);
    } catch (err) {
      next(err);
    }
  };

  getDailyPerformance = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const campaignId = req.params.id as string;
      const userId = req.user!.sub;
      const days = req.query.days ? parseInt(req.query.days as string, 10) : 30;
      const result = await this.performanceService.getDailyPerformance(campaignId, userId, days);
      success(res, result);
    } catch (err) {
      next(err);
    }
  };

  getOverview = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.sub;
      const result = await this.performanceService.getOverview(userId);
      success(res, result);
    } catch (err) {
      next(err);
    }
  };
}
