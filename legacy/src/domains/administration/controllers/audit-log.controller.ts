import type { Request, Response, NextFunction } from 'express';

import { success, paginated } from '../../../infrastructure/http/response.helper';
import type { AuditLogService } from '../services/audit-log.service';

export class AuditLogController {
  constructor(private readonly auditLogService: AuditLogService) {}

  list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { page, limit, ...filters } = req.query as Record<string, unknown>;
      const result = await this.auditLogService.list(
        filters as import('../types/administration.types').AuditLogFilters,
        { page: page as number, limit: limit as number },
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
      const log = await this.auditLogService.getById(req.params.id as string);
      success(res, log);
    } catch (err) {
      next(err);
    }
  };
}
