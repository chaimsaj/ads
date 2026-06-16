import { describe, it, expect, vi, beforeEach } from 'vitest';

import { StripeRefundService } from '../stripe-refund.service';
import * as stripeConfig from '../../config/stripe.config';

// Mock the stripe config
vi.mock('../../config/stripe.config', () => ({
  getStripeClient: vi.fn(),
}));

describe('StripeRefundService', () => {
  let service: StripeRefundService;
  let mockStripe: {
    refunds: {
      create: ReturnType<typeof vi.fn>;
      retrieve: ReturnType<typeof vi.fn>;
      list: ReturnType<typeof vi.fn>;
    };
  };

  const mockRefund = {
    id: 're_123',
    payment_intent: 'pi_123',
    amount: 5000,
    currency: 'usd',
    status: 'succeeded',
    reason: 'requested_by_customer',
  };

  beforeEach(() => {
    vi.clearAllMocks();

    mockStripe = {
      refunds: {
        create: vi.fn(),
        retrieve: vi.fn(),
        list: vi.fn(),
      },
    };

    vi.mocked(stripeConfig.getStripeClient).mockReturnValue(mockStripe as unknown as ReturnType<typeof stripeConfig.getStripeClient>);

    service = new StripeRefundService();
  });

  describe('createRefund', () => {
    it('should create refund successfully', async () => {
      mockStripe.refunds.create.mockResolvedValue(mockRefund);

      const result = await service.createRefund({ paymentIntentId: 'pi_123' });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockRefund);
    });

    it('should create refund with payment_intent parameter', async () => {
      mockStripe.refunds.create.mockResolvedValue(mockRefund);

      await service.createRefund({ paymentIntentId: 'pi_123' });

      expect(mockStripe.refunds.create).toHaveBeenCalledWith({
        payment_intent: 'pi_123',
      });
    });

    it('should include amount when provided', async () => {
      mockStripe.refunds.create.mockResolvedValue(mockRefund);

      await service.createRefund({ paymentIntentId: 'pi_123', amount: 2500 });

      expect(mockStripe.refunds.create).toHaveBeenCalledWith({
        payment_intent: 'pi_123',
        amount: 2500,
      });
    });

    it('should include reason when provided', async () => {
      mockStripe.refunds.create.mockResolvedValue(mockRefund);

      await service.createRefund({
        paymentIntentId: 'pi_123',
        reason: 'duplicate',
      });

      expect(mockStripe.refunds.create).toHaveBeenCalledWith({
        payment_intent: 'pi_123',
        reason: 'duplicate',
      });
    });

    it('should include metadata when provided', async () => {
      mockStripe.refunds.create.mockResolvedValue(mockRefund);

      await service.createRefund({
        paymentIntentId: 'pi_123',
        metadata: { refund_reason: 'test' },
      });

      expect(mockStripe.refunds.create).toHaveBeenCalledWith({
        payment_intent: 'pi_123',
        metadata: { refund_reason: 'test' },
      });
    });

    it('should handle Stripe error', async () => {
      const stripeError = {
        type: 'StripeInvalidRequestError',
        message: 'Payment intent not found',
        code: 'resource_missing',
      };
      mockStripe.refunds.create.mockRejectedValue(stripeError);

      const result = await service.createRefund({ paymentIntentId: 'pi_invalid' });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Payment intent not found');
      expect(result.stripeErrorCode).toBe('resource_missing');
    });

    it('should handle generic error', async () => {
      mockStripe.refunds.create.mockRejectedValue(new Error('Network error'));

      const result = await service.createRefund({ paymentIntentId: 'pi_123' });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Network error');
    });
  });

  describe('getRefund', () => {
    it('should retrieve refund successfully', async () => {
      mockStripe.refunds.retrieve.mockResolvedValue(mockRefund);

      const result = await service.getRefund('re_123');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockRefund);
    });

    it('should handle Stripe error', async () => {
      const stripeError = {
        type: 'StripeInvalidRequestError',
        message: 'Refund not found',
        code: 'resource_missing',
      };
      mockStripe.refunds.retrieve.mockRejectedValue(stripeError);

      const result = await service.getRefund('re_invalid');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Refund not found');
    });
  });

  describe('listRefunds', () => {
    const mockRefundsList = {
      data: [mockRefund, { ...mockRefund, id: 're_456' }],
    };

    it('should list refunds successfully', async () => {
      mockStripe.refunds.list.mockResolvedValue(mockRefundsList);

      const result = await service.listRefunds('pi_123');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockRefundsList.data);
    });

    it('should list refunds with payment_intent filter', async () => {
      mockStripe.refunds.list.mockResolvedValue(mockRefundsList);

      await service.listRefunds('pi_123');

      expect(mockStripe.refunds.list).toHaveBeenCalledWith({
        payment_intent: 'pi_123',
        limit: 10,
      });
    });

    it('should use custom limit when provided', async () => {
      mockStripe.refunds.list.mockResolvedValue(mockRefundsList);

      await service.listRefunds('pi_123', 25);

      expect(mockStripe.refunds.list).toHaveBeenCalledWith({
        payment_intent: 'pi_123',
        limit: 25,
      });
    });

    it('should handle Stripe error', async () => {
      const stripeError = {
        type: 'StripeInvalidRequestError',
        message: 'Invalid request',
        code: 'invalid_request',
      };
      mockStripe.refunds.list.mockRejectedValue(stripeError);

      const result = await service.listRefunds('pi_invalid');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid request');
    });

    it('should return empty array when no refunds', async () => {
      mockStripe.refunds.list.mockResolvedValue({ data: [] });

      const result = await service.listRefunds('pi_123');

      expect(result.success).toBe(true);
      expect(result.data).toEqual([]);
    });
  });
});
