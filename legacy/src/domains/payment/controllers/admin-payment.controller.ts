import type { Request, Response, NextFunction } from 'express';

import { success } from '../../../infrastructure/http/response.helper';
import type { StripeAdminService } from '../services/stripe-admin.service';
import type { StripeRefundService } from '../services/stripe-refund.service';

export class AdminPaymentController {
  constructor(
    private readonly adminService: StripeAdminService,
    private readonly refundService: StripeRefundService,
  ) {}

  getBalance = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.adminService.getBalance();

      if (!result.success) {
        res.status(400).json(result);
        return;
      }

      success(res, result.data);
    } catch (err) {
      next(err);
    }
  };

  getStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const startDate = req.query.startDate
        ? new Date(req.query.startDate as string)
        : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const endDate = req.query.endDate
        ? new Date(req.query.endDate as string)
        : new Date();

      const result = await this.adminService.getPaymentStats(startDate, endDate);

      if (!result.success) {
        res.status(400).json(result);
        return;
      }

      success(res, result.data);
    } catch (err) {
      next(err);
    }
  };

  listDisputes = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const limit = Number(req.query.limit) || 10;
      const result = await this.adminService.listDisputes(limit);

      if (!result.success) {
        res.status(400).json(result);
        return;
      }

      success(res, result.data);
    } catch (err) {
      next(err);
    }
  };

  listTransactions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

      const result = await this.adminService.listTransactions({
        limit: Number(req.query.limit) || 20,
        startDate,
        endDate,
      });

      if (!result.success) {
        res.status(400).json(result);
        return;
      }

      // Filter by status client-side since Stripe API doesn't support status filter on paymentIntents.list
      const status = req.query.status as string | undefined;
      if (status && result.data) {
        const filtered = result.data.filter((pi) => pi.status === status);
        success(res, filtered);
        return;
      }

      success(res, result.data);
    } catch (err) {
      next(err);
    }
  };

  createRefund = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.refundService.createRefund({
        paymentIntentId: req.body.paymentIntentId,
        amount: req.body.amount,
        reason: req.body.reason,
      });

      if (!result.success) {
        res.status(400).json(result);
        return;
      }

      success(res, result.data, 'Refund created');
    } catch (err) {
      next(err);
    }
  };
}
