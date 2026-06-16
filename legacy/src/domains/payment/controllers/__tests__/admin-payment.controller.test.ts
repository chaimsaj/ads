import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request, Response, NextFunction } from 'express';

import { mockObjectId } from '../../../../../tests/helpers/objectid-helper';
import { AdminPaymentController } from '../admin-payment.controller';
import type { StripeAdminService } from '../../services/stripe-admin.service';
import type { StripeRefundService } from '../../services/stripe-refund.service';

// Mock the response helper module
vi.mock('../../../../infrastructure/http/response.helper', () => ({
  success: vi.fn(),
}));

import { success } from '../../../../infrastructure/http/response.helper';

describe('AdminPaymentController', () => {
  let controller: AdminPaymentController;
  let mockAdminService: Partial<StripeAdminService>;
  let mockRefundService: Partial<StripeRefundService>;
  let mockReq: Request;
  let mockRes: Response;
  let mockNext: NextFunction;

  beforeEach(() => {
    vi.clearAllMocks();

    mockAdminService = {
      getBalance: vi.fn(),
      getPaymentStats: vi.fn(),
      listDisputes: vi.fn(),
      listTransactions: vi.fn(),
    };

    mockRefundService = {
      createRefund: vi.fn(),
    };

    mockReq = {
      body: {},
      params: {},
      query: {},
      user: { sub: mockObjectId(1), email: 'admin@example.com', role: 'admin', type: 'admin_access' },
    } as unknown as Request;

    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    } as unknown as Response;

    mockNext = vi.fn();

    controller = new AdminPaymentController(
      mockAdminService as StripeAdminService,
      mockRefundService as StripeRefundService,
    );
  });

  describe('getBalance', () => {
    it('should call adminService.getBalance', async () => {
      const balanceData = { available: [{ amount: 10000, currency: 'usd' }] };
      vi.mocked(mockAdminService.getBalance!).mockResolvedValue({
        success: true,
        data: balanceData,
      });

      await controller.getBalance(mockReq, mockRes, mockNext);

      expect(mockAdminService.getBalance).toHaveBeenCalled();
      expect(success).toHaveBeenCalledWith(mockRes, balanceData);
    });

    it('should return 400 when getBalance fails', async () => {
      vi.mocked(mockAdminService.getBalance!).mockResolvedValue({
        success: false,
        error: 'Failed to fetch balance',
      });

      await controller.getBalance(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Failed to fetch balance',
      });
    });

    it('should call next with error on exception', async () => {
      const error = new Error('Stripe API error');
      vi.mocked(mockAdminService.getBalance!).mockRejectedValue(error);

      await controller.getBalance(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('getStats', () => {
    const statsData = {
      totalRevenue: 50000,
      totalTransactions: 100,
      averageTransactionValue: 500,
    };

    it('should call adminService.getPaymentStats with date range from query', async () => {
      mockReq.query = {
        startDate: '2024-01-01',
        endDate: '2024-01-31',
      };
      vi.mocked(mockAdminService.getPaymentStats!).mockResolvedValue({
        success: true,
        data: statsData,
      });

      await controller.getStats(mockReq, mockRes, mockNext);

      expect(mockAdminService.getPaymentStats).toHaveBeenCalledWith(
        new Date('2024-01-01'),
        new Date('2024-01-31'),
      );
      expect(success).toHaveBeenCalledWith(mockRes, statsData);
    });

    it('should use default date range when not provided', async () => {
      mockReq.query = {};
      vi.mocked(mockAdminService.getPaymentStats!).mockResolvedValue({
        success: true,
        data: statsData,
      });

      await controller.getStats(mockReq, mockRes, mockNext);

      expect(mockAdminService.getPaymentStats).toHaveBeenCalledWith(
        expect.any(Date),
        expect.any(Date),
      );
    });

    it('should return 400 when getPaymentStats fails', async () => {
      mockReq.query = {};
      vi.mocked(mockAdminService.getPaymentStats!).mockResolvedValue({
        success: false,
        error: 'Failed to fetch stats',
      });

      await controller.getStats(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it('should call next with error on exception', async () => {
      mockReq.query = {};
      const error = new Error('Stats error');
      vi.mocked(mockAdminService.getPaymentStats!).mockRejectedValue(error);

      await controller.getStats(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('listDisputes', () => {
    const disputesData = [
      { id: 'dp_123', amount: 5000, status: 'open' },
      { id: 'dp_456', amount: 3000, status: 'under_review' },
    ];

    it('should call adminService.listDisputes with limit from query', async () => {
      mockReq.query = { limit: '25' };
      vi.mocked(mockAdminService.listDisputes!).mockResolvedValue({
        success: true,
        data: disputesData,
      });

      await controller.listDisputes(mockReq, mockRes, mockNext);

      expect(mockAdminService.listDisputes).toHaveBeenCalledWith(25);
      expect(success).toHaveBeenCalledWith(mockRes, disputesData);
    });

    it('should use default limit when not provided', async () => {
      mockReq.query = {};
      vi.mocked(mockAdminService.listDisputes!).mockResolvedValue({
        success: true,
        data: [],
      });

      await controller.listDisputes(mockReq, mockRes, mockNext);

      expect(mockAdminService.listDisputes).toHaveBeenCalledWith(10);
    });

    it('should return 400 when listDisputes fails', async () => {
      mockReq.query = {};
      vi.mocked(mockAdminService.listDisputes!).mockResolvedValue({
        success: false,
        error: 'Failed to fetch disputes',
      });

      await controller.listDisputes(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it('should call next with error on exception', async () => {
      mockReq.query = {};
      const error = new Error('Disputes error');
      vi.mocked(mockAdminService.listDisputes!).mockRejectedValue(error);

      await controller.listDisputes(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('listTransactions', () => {
    const transactionsData = [
      { id: 'txn_123', amount: 5000, type: 'payment' },
      { id: 'txn_456', amount: 3000, type: 'refund' },
    ];

    it('should call adminService.listTransactions with limit from query', async () => {
      mockReq.query = { limit: '50' };
      vi.mocked(mockAdminService.listTransactions!).mockResolvedValue({
        success: true,
        data: transactionsData,
      });

      await controller.listTransactions(mockReq, mockRes, mockNext);

      expect(mockAdminService.listTransactions).toHaveBeenCalledWith({ limit: 50 });
      expect(success).toHaveBeenCalledWith(mockRes, transactionsData);
    });

    it('should use default limit when not provided', async () => {
      mockReq.query = {};
      vi.mocked(mockAdminService.listTransactions!).mockResolvedValue({
        success: true,
        data: [],
      });

      await controller.listTransactions(mockReq, mockRes, mockNext);

      expect(mockAdminService.listTransactions).toHaveBeenCalledWith({ limit: 20 });
    });

    it('should return 400 when listTransactions fails', async () => {
      mockReq.query = {};
      vi.mocked(mockAdminService.listTransactions!).mockResolvedValue({
        success: false,
        error: 'Failed to fetch transactions',
      });

      await controller.listTransactions(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it('should call next with error on exception', async () => {
      mockReq.query = {};
      const error = new Error('Transactions error');
      vi.mocked(mockAdminService.listTransactions!).mockRejectedValue(error);

      await controller.listTransactions(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('createRefund', () => {
    const refundData = {
      paymentIntentId: 'pi_123',
      amount: 2500,
      reason: 'Customer request',
    };

    it('should call refundService.createRefund with correct parameters', async () => {
      mockReq.body = refundData;
      const refundResult = { id: 're_123', amount: 2500, status: 'succeeded' };
      vi.mocked(mockRefundService.createRefund!).mockResolvedValue({
        success: true,
        data: refundResult,
      });

      await controller.createRefund(mockReq, mockRes, mockNext);

      expect(mockRefundService.createRefund).toHaveBeenCalledWith({
        paymentIntentId: 'pi_123',
        amount: 2500,
        reason: 'Customer request',
      });
      expect(success).toHaveBeenCalledWith(mockRes, refundResult, 'Refund created');
    });

    it('should return 400 when refund creation fails', async () => {
      mockReq.body = refundData;
      vi.mocked(mockRefundService.createRefund!).mockResolvedValue({
        success: false,
        error: 'Refund amount exceeds original charge',
      });

      await controller.createRefund(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Refund amount exceeds original charge',
      });
    });

    it('should call next with error on exception', async () => {
      mockReq.body = refundData;
      const error = new Error('Refund error');
      vi.mocked(mockRefundService.createRefund!).mockRejectedValue(error);

      await controller.createRefund(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });

    it('should handle partial refund', async () => {
      mockReq.body = { ...refundData, amount: 1000 };
      const refundResult = { id: 're_456', amount: 1000, status: 'succeeded' };
      vi.mocked(mockRefundService.createRefund!).mockResolvedValue({
        success: true,
        data: refundResult,
      });

      await controller.createRefund(mockReq, mockRes, mockNext);

      expect(mockRefundService.createRefund).toHaveBeenCalledWith(
        expect.objectContaining({ amount: 1000 }),
      );
    });
  });
});
