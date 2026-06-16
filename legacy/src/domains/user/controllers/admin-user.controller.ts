import type { Request, Response, NextFunction } from 'express';

import { success, noContent, paginated } from '../../../infrastructure/http/response.helper';
import type { AdminUserManagementService } from '../services/admin-user-management.service';

export class AdminUserController {
  constructor(private readonly userService: AdminUserManagementService) {}

  list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { page, limit, sortBy, sortOrder, ...filters } = req.query as Record<string, unknown>;

      const result = await this.userService.listAll(
        filters as import('../types/user.types').UserFilters,
        {
          page: page as number,
          limit: limit as number,
          sortBy: sortBy as string | undefined,
          sortOrder: sortOrder as 'asc' | 'desc' | undefined,
        },
      );

      paginated(
        res,
        result.data,
        {
          total: result.meta.total,
          currentPage: result.meta.page,
          lastPage: result.meta.totalPages,
          perPage: result.meta.limit,
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
      const result = await this.userService.getById(id);
      success(res, result);
    } catch (err) {
      next(err);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const adminId = req.user!.sub;
      const ipAddress = req.ip ?? '0.0.0.0';
      const userAgent = req.headers['user-agent'];

      const result = await this.userService.update(id, req.body, adminId, ipAddress, userAgent);
      success(res, result, 'User updated');
    } catch (err) {
      next(err);
    }
  };

  updateStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const adminId = req.user!.sub;
      const ipAddress = req.ip ?? '0.0.0.0';
      const userAgent = req.headers['user-agent'];

      const result = await this.userService.updateStatus(
        id,
        req.body.status,
        adminId,
        ipAddress,
        userAgent,
      );
      success(res, result, 'User status updated');
    } catch (err) {
      next(err);
    }
  };

  suspend = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const adminId = req.user!.sub;
      const ipAddress = req.ip ?? '0.0.0.0';
      const userAgent = req.headers['user-agent'];

      const result = await this.userService.updateStatus(id, 'SUSPENDED', adminId, ipAddress, userAgent);
      success(res, result, 'User suspended');
    } catch (err) {
      next(err);
    }
  };

  activate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const adminId = req.user!.sub;
      const ipAddress = req.ip ?? '0.0.0.0';
      const userAgent = req.headers['user-agent'];

      const result = await this.userService.updateStatus(id, 'ACTIVE', adminId, ipAddress, userAgent);
      success(res, result, 'User activated');
    } catch (err) {
      next(err);
    }
  };

  destroy = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const adminId = req.user!.sub;
      const ipAddress = req.ip ?? '0.0.0.0';
      const userAgent = req.headers['user-agent'];

      await this.userService.deleteUser(id, adminId, ipAddress, userAgent);
      noContent(res);
    } catch (err) {
      next(err);
    }
  };

  bulkAction = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { ids, action } = req.body;
      const adminId = req.user!.sub;
      const ipAddress = req.ip ?? '0.0.0.0';
      const userAgent = req.headers['user-agent'];

      let result;

      if (action === 'activate') {
        result = await this.userService.bulkUpdateStatus(ids, 'ACTIVE', adminId, ipAddress, userAgent);
      } else if (action === 'suspend') {
        result = await this.userService.bulkUpdateStatus(ids, 'SUSPENDED', adminId, ipAddress, userAgent);
      } else {
        result = await this.userService.bulkDelete(ids, adminId, ipAddress, userAgent);
      }

      success(res, result, `Bulk ${action} completed`);
    } catch (err) {
      next(err);
    }
  };

  statusCounts = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.userService.getStatusCounts();
      success(res, result);
    } catch (err) {
      next(err);
    }
  };
}
