import type { Request, Response, NextFunction } from 'express';

import { success, created, noContent, paginated } from '../../../infrastructure/http/response.helper';
import type { CampaignExportService } from '../services/campaign-export.service';
import type { CampaignService } from '../services/campaign.service';

export class CampaignController {
  constructor(
    private readonly campaignService: CampaignService,
    private readonly exportService: CampaignExportService,
  ) {}

  list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.sub;
      const { page, limit, sortBy, sortOrder, ...filters } = req.query as Record<string, unknown>;
      const result = await this.campaignService.listForUser(
        userId,
        filters,
        { page: page as number, limit: limit as number, sortBy: sortBy as string, sortOrder: sortOrder as 'asc' | 'desc' },
      );
      paginated(res, result.data, {
        currentPage: result.meta.page,
        lastPage: result.meta.totalPages,
        perPage: result.meta.limit,
        total: result.meta.total,
      }, `${req.baseUrl}${req.path}`);
    } catch (err) {
      next(err);
    }
  };

  show = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const result = await this.campaignService.getForUser(id, req.user!.sub);
      success(res, result);
    } catch (err) {
      next(err);
    }
  };

  store = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.campaignService.create({
        ...req.body,
        userId: req.user!.sub,
      });
      created(res, result, 'Campaign created successfully');
    } catch (err) {
      next(err);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const result = await this.campaignService.updateForUser(id, req.user!.sub, req.body);
      success(res, result, 'Campaign updated successfully');
    } catch (err) {
      next(err);
    }
  };

  updateStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const result = await this.campaignService.updateStatusForUser(id, req.user!.sub, req.body.status);
      success(res, result, 'Campaign status updated');
    } catch (err) {
      next(err);
    }
  };

  destroy = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      await this.campaignService.deleteForUser(id, req.user!.sub);
      noContent(res);
    } catch (err) {
      next(err);
    }
  };

  duplicate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const result = await this.campaignService.duplicateForUser(id, req.user!.sub);
      created(res, result, 'Campaign duplicated successfully');
    } catch (err) {
      next(err);
    }
  };

  statistics = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.campaignService.getStatisticsForUser(req.user!.sub);
      success(res, result);
    } catch (err) {
      next(err);
    }
  };

  exportCsv = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.sub;
      const filters = req.query as Record<string, unknown>;
      const csv = await this.exportService.exportUserCSV(userId, filters);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="campaigns.csv"');
      res.send(csv);
    } catch (err) {
      next(err);
    }
  };
}
