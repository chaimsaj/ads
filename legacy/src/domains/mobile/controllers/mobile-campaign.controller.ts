import type { Request, Response, NextFunction } from 'express';

import { paginated, success } from '../../../infrastructure/http/response.helper';
import type { MobileCampaignService } from '../services/mobile-campaign.service';

export class MobileCampaignController {
  constructor(private readonly campaignService: MobileCampaignService) {}

  list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { page, limit, adType, adFormat, latitude, longitude } = req.query as Record<string, unknown>;

      const result = await this.campaignService.listActiveCampaigns(
        {
          adType: adType as string | undefined,
          adFormat: adFormat as string | undefined,
          latitude: latitude as number | undefined,
          longitude: longitude as number | undefined,
        },
        { page: page as number, limit: limit as number },
      );

      paginated(
        res,
        result.data,
        {
          currentPage: result.meta.page,
          lastPage: result.meta.totalPages,
          perPage: result.meta.limit,
          total: result.meta.total,
        },
        `${req.baseUrl}${req.path}`,
      );
    } catch (err) {
      next(err);
    }
  };

  show = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const result = await this.campaignService.getActiveCampaign(id);
      success(res, result);
    } catch (err) {
      next(err);
    }
  };
}
