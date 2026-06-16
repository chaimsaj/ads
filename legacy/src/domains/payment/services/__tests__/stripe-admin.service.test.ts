import { describe, it, expect, vi, beforeEach } from 'vitest';

import { StripeAdminService } from '../stripe-admin.service';
import * as stripeConfig from '../../config/stripe.config';

// Mock the stripe config
vi.mock('../../config/stripe.config', () => ({
  getStripeClient: vi.fn(),
}));

describe('StripeAdminService', () => {
  let service: StripeAdminService;
  let mockStripe: {
    balance: {
      retrieve: ReturnType<typeof vi.fn>;
    };
    charges: {
      list: ReturnType<typeof vi.fn>;
    };
    refunds: {
      list: ReturnType<typeof vi.fn>;
      create: ReturnType<typeof vi.fn>;
    };
    disputes: {
      list: ReturnType<typeof vi.fn>;
    };
    paymentIntents: {
      list: ReturnType<typeof vi.fn>;
    };
  };

  const mockBalance = {
    available: [{ amount: 100000, currency: 'usd' }],
    pending: [{ amount: 25000, currency: 'usd' }],
  };

  const mockCharges = {
    data: [
      { id: 'ch_1', amount: 5000, status: 'succeeded' },
      { id: 'ch_2', amount: 3000, status: 'succeeded' },
      { id: 'ch_3', amount: 2000, status: 'failed' },
    ],
  };

  const mockRefunds = {
    data: [
      { id: 're_1', amount: 1000 },
      { id: 're_2', amount: 500 },
    ],
  };

  const mockDisputes = {
    data: [
      {
        id: 'dp_123',
        payment_intent: 'pi_123',
        amount: 5000,
        currency: 'usd',
        status: 'needs_response',
        reason: 'fraudulent',
        evidence_details: { due_by: 1640000000 },
        created: 1639000000,
      },
    ],
  };

  const mockPaymentIntents = {
    data: [
      { id: 'pi_123', amount: 5000, status: 'succeeded' },
      { id: 'pi_456', amount: 3000, status: 'requires_payment_method' },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();

    mockStripe = {
      balance: {
        retrieve: vi.fn(),
      },
      charges: {
        list: vi.fn(),
      },
      refunds: {
        list: vi.fn(),
        create: vi.fn(),
      },
      disputes: {
        list: vi.fn(),
      },
      paymentIntents: {
        list: vi.fn(),
      },
    };

    vi.mocked(stripeConfig.getStripeClient).mockReturnValue(mockStripe as unknown as ReturnType<typeof stripeConfig.getStripeClient>);

    service = new StripeAdminService();
  });

  describe('getBalance', () => {
    it('should retrieve balance successfully', async () => {
      mockStripe.balance.retrieve.mockResolvedValue(mockBalance);

      const result = await service.getBalance();

      expect(result.success).toBe(true);
      expect(result.data?.available).toHaveLength(1);
      expect(result.data?.pending).toHaveLength(1);
    });

    it('should map balance data correctly', async () => {
      mockStripe.balance.retrieve.mockResolvedValue(mockBalance);

      const result = await service.getBalance();

      expect(result.data?.available[0]).toEqual({ amount: 100000, currency: 'usd' });
      expect(result.data?.pending[0]).toEqual({ amount: 25000, currency: 'usd' });
    });

    it('should handle Stripe error', async () => {
      const stripeError = {
        type: 'StripeAuthenticationError',
        message: 'Invalid API key',
        code: 'api_key_invalid',
      };
      mockStripe.balance.retrieve.mockRejectedValue(stripeError);

      const result = await service.getBalance();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid API key');
    });
  });

  describe('getPaymentStats', () => {
    const startDate = new Date('2024-01-01');
    const endDate = new Date('2024-01-31');

    it('should retrieve payment stats successfully', async () => {
      mockStripe.charges.list.mockResolvedValue(mockCharges);
      mockStripe.refunds.list.mockResolvedValue(mockRefunds);

      const result = await service.getPaymentStats(startDate, endDate);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });

    it('should calculate total revenue from successful charges', async () => {
      mockStripe.charges.list.mockResolvedValue(mockCharges);
      mockStripe.refunds.list.mockResolvedValue(mockRefunds);

      const result = await service.getPaymentStats(startDate, endDate);

      expect(result.data?.totalRevenue).toBe(8000); // 5000 + 3000
    });

    it('should count successful and failed payments', async () => {
      mockStripe.charges.list.mockResolvedValue(mockCharges);
      mockStripe.refunds.list.mockResolvedValue(mockRefunds);

      const result = await service.getPaymentStats(startDate, endDate);

      expect(result.data?.successfulPayments).toBe(2);
      expect(result.data?.failedPayments).toBe(1);
    });

    it('should calculate refunded amount', async () => {
      mockStripe.charges.list.mockResolvedValue(mockCharges);
      mockStripe.refunds.list.mockResolvedValue(mockRefunds);

      const result = await service.getPaymentStats(startDate, endDate);

      expect(result.data?.refundedAmount).toBe(1500); // 1000 + 500
    });

    it('should calculate average transaction value', async () => {
      mockStripe.charges.list.mockResolvedValue(mockCharges);
      mockStripe.refunds.list.mockResolvedValue(mockRefunds);

      const result = await service.getPaymentStats(startDate, endDate);

      expect(result.data?.averageTransactionValue).toBe(4000); // 8000 / 2
    });

    it('should handle zero successful payments for average', async () => {
      mockStripe.charges.list.mockResolvedValue({ data: [] });
      mockStripe.refunds.list.mockResolvedValue({ data: [] });

      const result = await service.getPaymentStats(startDate, endDate);

      expect(result.data?.averageTransactionValue).toBe(0);
    });

    it('should calculate period comparison', async () => {
      mockStripe.charges.list.mockResolvedValue(mockCharges);
      mockStripe.refunds.list.mockResolvedValue(mockRefunds);

      const result = await service.getPaymentStats(startDate, endDate);

      expect(result.data?.periodComparison).toBeDefined();
      expect(result.data?.periodComparison.revenueGrowth).toBeDefined();
      expect(result.data?.periodComparison.transactionGrowth).toBeDefined();
    });

    it('should handle Stripe error', async () => {
      const stripeError = {
        type: 'StripeInvalidRequestError',
        message: 'Invalid date range',
        code: 'invalid_request',
      };
      mockStripe.charges.list.mockRejectedValue(stripeError);

      const result = await service.getPaymentStats(startDate, endDate);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid date range');
    });
  });

  describe('listDisputes', () => {
    it('should list disputes successfully', async () => {
      mockStripe.disputes.list.mockResolvedValue(mockDisputes);

      const result = await service.listDisputes();

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
    });

    it('should map dispute data correctly', async () => {
      mockStripe.disputes.list.mockResolvedValue(mockDisputes);

      const result = await service.listDisputes();

      const dispute = result.data?.[0];
      expect(dispute?.id).toBe('dp_123');
      expect(dispute?.paymentIntentId).toBe('pi_123');
      expect(dispute?.amount).toBe(5000);
      expect(dispute?.currency).toBe('usd');
      expect(dispute?.status).toBe('needs_response');
      expect(dispute?.reason).toBe('fraudulent');
    });

    it('should use custom limit when provided', async () => {
      mockStripe.disputes.list.mockResolvedValue(mockDisputes);

      await service.listDisputes(25);

      expect(mockStripe.disputes.list).toHaveBeenCalledWith({ limit: 25 });
    });

    it('should use default limit of 10', async () => {
      mockStripe.disputes.list.mockResolvedValue(mockDisputes);

      await service.listDisputes();

      expect(mockStripe.disputes.list).toHaveBeenCalledWith({ limit: 10 });
    });

    it('should handle payment_intent as object', async () => {
      const disputeWithObject = {
        data: [{
          ...mockDisputes.data[0],
          payment_intent: { id: 'pi_obj_123' },
        }],
      };
      mockStripe.disputes.list.mockResolvedValue(disputeWithObject);

      const result = await service.listDisputes();

      expect(result.data?.[0].paymentIntentId).toBe('pi_obj_123');
    });

    it('should handle missing evidence_details', async () => {
      const disputeWithoutEvidence = {
        data: [{
          ...mockDisputes.data[0],
          evidence_details: null,
        }],
      };
      mockStripe.disputes.list.mockResolvedValue(disputeWithoutEvidence);

      const result = await service.listDisputes();

      expect(result.data?.[0].evidenceDueBy).toBeUndefined();
    });

    it('should handle Stripe error', async () => {
      const stripeError = {
        type: 'StripeInvalidRequestError',
        message: 'Invalid request',
        code: 'invalid_request',
      };
      mockStripe.disputes.list.mockRejectedValue(stripeError);

      const result = await service.listDisputes();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid request');
    });
  });

  describe('listTransactions', () => {
    it('should list transactions successfully', async () => {
      mockStripe.paymentIntents.list.mockResolvedValue(mockPaymentIntents);

      const result = await service.listTransactions();

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockPaymentIntents.data);
    });

    it('should use default limit of 20', async () => {
      mockStripe.paymentIntents.list.mockResolvedValue(mockPaymentIntents);

      await service.listTransactions();

      expect(mockStripe.paymentIntents.list).toHaveBeenCalledWith({ limit: 20 });
    });

    it('should use custom limit when provided', async () => {
      mockStripe.paymentIntents.list.mockResolvedValue(mockPaymentIntents);

      await service.listTransactions({ limit: 50 });

      expect(mockStripe.paymentIntents.list).toHaveBeenCalledWith({ limit: 50 });
    });

    it('should use startingAfter for pagination', async () => {
      mockStripe.paymentIntents.list.mockResolvedValue(mockPaymentIntents);

      await service.listTransactions({ startingAfter: 'pi_100' });

      expect(mockStripe.paymentIntents.list).toHaveBeenCalledWith({
        limit: 20,
        starting_after: 'pi_100',
      });
    });

    it('should handle Stripe error', async () => {
      const stripeError = {
        type: 'StripeInvalidRequestError',
        message: 'Invalid request',
        code: 'invalid_request',
      };
      mockStripe.paymentIntents.list.mockRejectedValue(stripeError);

      const result = await service.listTransactions();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid request');
    });
  });

  describe('createRefund', () => {
    const mockRefund = {
      id: 're_123',
      payment_intent: 'pi_123',
      amount: 5000,
      status: 'succeeded',
    };

    it('should create refund successfully', async () => {
      mockStripe.refunds.create.mockResolvedValue(mockRefund);

      const result = await service.createRefund('pi_123');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockRefund);
    });

    it('should create refund with payment_intent', async () => {
      mockStripe.refunds.create.mockResolvedValue(mockRefund);

      await service.createRefund('pi_123');

      expect(mockStripe.refunds.create).toHaveBeenCalledWith({
        payment_intent: 'pi_123',
      });
    });

    it('should include amount when provided', async () => {
      mockStripe.refunds.create.mockResolvedValue(mockRefund);

      await service.createRefund('pi_123', 2500);

      expect(mockStripe.refunds.create).toHaveBeenCalledWith({
        payment_intent: 'pi_123',
        amount: 2500,
      });
    });

    it('should include reason when provided', async () => {
      mockStripe.refunds.create.mockResolvedValue(mockRefund);

      await service.createRefund('pi_123', undefined, 'duplicate');

      expect(mockStripe.refunds.create).toHaveBeenCalledWith({
        payment_intent: 'pi_123',
        reason: 'duplicate',
      });
    });

    it('should include both amount and reason when provided', async () => {
      mockStripe.refunds.create.mockResolvedValue(mockRefund);

      await service.createRefund('pi_123', 3000, 'fraudulent');

      expect(mockStripe.refunds.create).toHaveBeenCalledWith({
        payment_intent: 'pi_123',
        amount: 3000,
        reason: 'fraudulent',
      });
    });

    it('should handle Stripe error', async () => {
      const stripeError = {
        type: 'StripeInvalidRequestError',
        message: 'Charge has already been refunded',
        code: 'charge_already_refunded',
      };
      mockStripe.refunds.create.mockRejectedValue(stripeError);

      const result = await service.createRefund('pi_123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Charge has already been refunded');
      expect(result.stripeErrorCode).toBe('charge_already_refunded');
    });

    it('should handle generic error', async () => {
      mockStripe.refunds.create.mockRejectedValue(new Error('Network error'));

      const result = await service.createRefund('pi_123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Network error');
    });
  });
});
