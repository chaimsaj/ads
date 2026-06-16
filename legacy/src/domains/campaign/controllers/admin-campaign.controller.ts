import type { Request, Response, NextFunction } from 'express';

import { success, noContent, paginated } from '../../../infrastructure/http/response.helper';
import type { CampaignExportService } from '../services/campaign-export.service';
import type { CampaignReviewService } from '../services/campaign-review.service';

export class AdminCampaignController {
  constructor(
    private readonly reviewService: CampaignReviewService,
    private readonly exportService: CampaignExportService,
  ) {}

  list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { page, limit, sortBy, sortOrder, ...filters } = req.query as Record<string, unknown>;
      const result = await this.reviewService.listAll(
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
      const result = await this.reviewService.getById(id);
      success(res, result);
    } catch (err) {
      next(err);
    }
  };

  approve = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const adminId = req.user!.sub;
      const ip = req.ip ?? 'unknown';
      const result = await this.reviewService.approve(id, adminId, ip, req.headers['user-agent']);
      success(res, result, 'Campaign approved');
    } catch (err) {
      next(err);
    }
  };

  reject = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const adminId = req.user!.sub;
      const ip = req.ip ?? 'unknown';
      const result = await this.reviewService.reject(id, adminId, req.body.reason, ip, req.headers['user-agent']);
      success(res, result, 'Campaign rejected');
    } catch (err) {
      next(err);
    }
  };

  updateStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const adminId = req.user!.sub;
      const ip = req.ip ?? 'unknown';
      const result = await this.reviewService.updateStatus(id, req.body.status, adminId, ip, req.headers['user-agent']);
      success(res, result, 'Campaign status updated');
    } catch (err) {
      next(err);
    }
  };

  destroy = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const adminId = req.user!.sub;
      const ip = req.ip ?? 'unknown';
      await this.reviewService.deleteCampaign(id, adminId, ip, req.headers['user-agent']);
      noContent(res);
    } catch (err) {
      next(err);
    }
  };

  bulkUpdateStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const adminId = req.user!.sub;
      const ip = req.ip ?? 'unknown';
      const result = await this.reviewService.bulkUpdateStatus(
        req.body.ids,
        req.body.status,
        adminId,
        ip,
        req.headers['user-agent'],
      );
      success(res, result);
    } catch (err) {
      next(err);
    }
  };

  bulkDelete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const adminId = req.user!.sub;
      const ip = req.ip ?? 'unknown';
      const result = await this.reviewService.bulkDelete(
        req.body.ids,
        adminId,
        ip,
        req.headers['user-agent'],
      );
      success(res, result);
    } catch (err) {
      next(err);
    }
  };

  statusCounts = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.reviewService.getStatusCounts();
      success(res, result);
    } catch (err) {
      next(err);
    }
  };

  exportCsv = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const filters = req.query as Record<string, unknown>;
      const csv = await this.exportService.exportCSV(filters);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="campaigns.csv"');
      res.send(csv);
    } catch (err) {
      next(err);
    }
  };
}
