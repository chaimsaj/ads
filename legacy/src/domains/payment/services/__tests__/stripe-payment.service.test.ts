import { describe, it, expect, vi, beforeEach } from 'vitest';

import { StripePaymentService } from '../stripe-payment.service';
import * as stripeConfig from '../../config/stripe.config';

// Mock the stripe config
vi.mock('../../config/stripe.config', () => ({
  getStripeClient: vi.fn(),
  STRIPE_METADATA_KEYS: {
    userId: 'myngly_user_id',
    platform: 'myngly_platform',
  },
}));

describe('StripePaymentService', () => {
  let service: StripePaymentService;
  let mockStripe: {
    paymentIntents: {
      create: ReturnType<typeof vi.fn>;
      confirm: ReturnType<typeof vi.fn>;
      retrieve: ReturnType<typeof vi.fn>;
      cancel: ReturnType<typeof vi.fn>;
    };
    paymentMethods: {
      attach: ReturnType<typeof vi.fn>;
      detach: ReturnType<typeof vi.fn>;
    };
    customers: {
      update: ReturnType<typeof vi.fn>;
    };
  };

  const mockPaymentIntent = {
    id: 'pi_123',
    customer: 'cus_123',
    amount: 5000,
    currency: 'usd',
    status: 'requires_payment_method',
    client_secret: 'pi_123_secret',
    metadata: { myngly_platform: 'myngly_ads' },
  };

  const mockPaymentMethod = {
    id: 'pm_123',
    type: 'card',
    card: { brand: 'visa', last4: '4242' },
  };

  const mockCustomer = {
    id: 'cus_123',
    email: 'test@example.com',
    invoice_settings: { default_payment_method: 'pm_123' },
  };

  beforeEach(() => {
    vi.clearAllMocks();

    mockStripe = {
      paymentIntents: {
        create: vi.fn(),
        confirm: vi.fn(),
        retrieve: vi.fn(),
        cancel: vi.fn(),
      },
      paymentMethods: {
        attach: vi.fn(),
        detach: vi.fn(),
      },
      customers: {
        update: vi.fn(),
      },
    };

    vi.mocked(stripeConfig.getStripeClient).mockReturnValue(mockStripe as unknown as ReturnType<typeof stripeConfig.getStripeClient>);

    service = new StripePaymentService();
  });

  describe('createPaymentIntent', () => {
    const paymentData = {
      customerId: 'cus_123',
      amount: 5000,
      currency: 'usd',
    };

    it('should create payment intent successfully', async () => {
      mockStripe.paymentIntents.create.mockResolvedValue(mockPaymentIntent);

      const result = await service.createPaymentIntent(paymentData);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockPaymentIntent);
    });

    it('should include platform metadata', async () => {
      mockStripe.paymentIntents.create.mockResolvedValue(mockPaymentIntent);

      await service.createPaymentIntent(paymentData);

      expect(mockStripe.paymentIntents.create).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: expect.objectContaining({
            myngly_platform: 'myngly_ads',
          }),
        }),
      );
    });

    it('should include payment method when provided', async () => {
      mockStripe.paymentIntents.create.mockResolvedValue(mockPaymentIntent);

      await service.createPaymentIntent({
        ...paymentData,
        paymentMethodId: 'pm_123',
      });

      expect(mockStripe.paymentIntents.create).toHaveBeenCalledWith(
        expect.objectContaining({
          payment_method: 'pm_123',
        }),
      );
    });

    it('should include description when provided', async () => {
      mockStripe.paymentIntents.create.mockResolvedValue(mockPaymentIntent);

      await service.createPaymentIntent({
        ...paymentData,
        description: 'Test payment',
      });

      expect(mockStripe.paymentIntents.create).toHaveBeenCalledWith(
        expect.objectContaining({
          description: 'Test payment',
        }),
      );
    });

    it('should set setup_future_usage when savePaymentMethod is true', async () => {
      mockStripe.paymentIntents.create.mockResolvedValue(mockPaymentIntent);

      await service.createPaymentIntent({
        ...paymentData,
        savePaymentMethod: true,
      });

      expect(mockStripe.paymentIntents.create).toHaveBeenCalledWith(
        expect.objectContaining({
          setup_future_usage: 'off_session',
        }),
      );
    });

    it('should use default currency when not provided', async () => {
      mockStripe.paymentIntents.create.mockResolvedValue(mockPaymentIntent);

      await service.createPaymentIntent({
        customerId: 'cus_123',
        amount: 5000,
      });

      expect(mockStripe.paymentIntents.create).toHaveBeenCalledWith(
        expect.objectContaining({
          currency: 'usd',
        }),
      );
    });

    it('should handle Stripe error', async () => {
      const stripeError = {
        type: 'StripeCardError',
        message: 'Card declined',
        code: 'card_declined',
      };
      mockStripe.paymentIntents.create.mockRejectedValue(stripeError);

      const result = await service.createPaymentIntent(paymentData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Card declined');
      expect(result.stripeErrorCode).toBe('card_declined');
    });

    it('should handle generic error', async () => {
      mockStripe.paymentIntents.create.mockRejectedValue(new Error('Network error'));

      const result = await service.createPaymentIntent(paymentData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Network error');
    });
  });

  describe('confirmPayment', () => {
    it('should confirm payment successfully', async () => {
      const confirmedIntent = { ...mockPaymentIntent, status: 'succeeded' };
      mockStripe.paymentIntents.confirm.mockResolvedValue(confirmedIntent);

      const result = await service.confirmPayment({ paymentIntentId: 'pi_123' });

      expect(result.success).toBe(true);
      expect(result.data?.status).toBe('succeeded');
    });

    it('should include payment method when provided', async () => {
      mockStripe.paymentIntents.confirm.mockResolvedValue(mockPaymentIntent);

      await service.confirmPayment({
        paymentIntentId: 'pi_123',
        paymentMethodId: 'pm_456',
      });

      expect(mockStripe.paymentIntents.confirm).toHaveBeenCalledWith('pi_123', {
        payment_method: 'pm_456',
      });
    });

    it('should handle Stripe error', async () => {
      const stripeError = {
        type: 'StripeInvalidRequestError',
        message: 'Payment intent not found',
        code: 'resource_missing',
      };
      mockStripe.paymentIntents.confirm.mockRejectedValue(stripeError);

      const result = await service.confirmPayment({ paymentIntentId: 'pi_invalid' });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Payment intent not found');
    });
  });

  describe('getPaymentIntent', () => {
    it('should retrieve payment intent successfully', async () => {
      mockStripe.paymentIntents.retrieve.mockResolvedValue(mockPaymentIntent);

      const result = await service.getPaymentIntent('pi_123');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockPaymentIntent);
    });

    it('should handle Stripe error', async () => {
      const stripeError = {
        type: 'StripeInvalidRequestError',
        message: 'Payment intent not found',
        code: 'resource_missing',
      };
      mockStripe.paymentIntents.retrieve.mockRejectedValue(stripeError);

      const result = await service.getPaymentIntent('pi_invalid');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Payment intent not found');
    });
  });

  describe('cancelPaymentIntent', () => {
    it('should cancel payment intent successfully', async () => {
      const cancelledIntent = { ...mockPaymentIntent, status: 'canceled' };
      mockStripe.paymentIntents.cancel.mockResolvedValue(cancelledIntent);

      const result = await service.cancelPaymentIntent('pi_123');

      expect(result.success).toBe(true);
      expect(result.data?.status).toBe('canceled');
    });

    it('should handle Stripe error', async () => {
      const stripeError = {
        type: 'StripeInvalidRequestError',
        message: 'Cannot cancel payment intent',
        code: 'intent_invalid_state',
      };
      mockStripe.paymentIntents.cancel.mockRejectedValue(stripeError);

      const result = await service.cancelPaymentIntent('pi_123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Cannot cancel payment intent');
    });
  });

  describe('addPaymentMethod', () => {
    it('should attach payment method successfully', async () => {
      mockStripe.paymentMethods.attach.mockResolvedValue(mockPaymentMethod);

      const result = await service.addPaymentMethod('cus_123', 'pm_123');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockPaymentMethod);
    });

    it('should call attach with correct parameters', async () => {
      mockStripe.paymentMethods.attach.mockResolvedValue(mockPaymentMethod);

      await service.addPaymentMethod('cus_123', 'pm_456');

      expect(mockStripe.paymentMethods.attach).toHaveBeenCalledWith('pm_456', {
        customer: 'cus_123',
      });
    });

    it('should handle Stripe error', async () => {
      const stripeError = {
        type: 'StripeInvalidRequestError',
        message: 'Payment method already attached',
        code: 'resource_already_exists',
      };
      mockStripe.paymentMethods.attach.mockRejectedValue(stripeError);

      const result = await service.addPaymentMethod('cus_123', 'pm_123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Payment method already attached');
    });
  });

  describe('removePaymentMethod', () => {
    it('should detach payment method successfully', async () => {
      mockStripe.paymentMethods.detach.mockResolvedValue(mockPaymentMethod);

      const result = await service.removePaymentMethod('pm_123');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockPaymentMethod);
    });

    it('should handle Stripe error', async () => {
      const stripeError = {
        type: 'StripeInvalidRequestError',
        message: 'Payment method not found',
        code: 'resource_missing',
      };
      mockStripe.paymentMethods.detach.mockRejectedValue(stripeError);

      const result = await service.removePaymentMethod('pm_invalid');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Payment method not found');
    });
  });

  describe('setDefaultPaymentMethod', () => {
    it('should set default payment method successfully', async () => {
      mockStripe.customers.update.mockResolvedValue(mockCustomer);

      const result = await service.setDefaultPaymentMethod('cus_123', 'pm_123');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockCustomer);
    });

    it('should call customers.update with correct parameters', async () => {
      mockStripe.customers.update.mockResolvedValue(mockCustomer);

      await service.setDefaultPaymentMethod('cus_123', 'pm_456');

      expect(mockStripe.customers.update).toHaveBeenCalledWith('cus_123', {
        invoice_settings: {
          default_payment_method: 'pm_456',
        },
      });
    });

    it('should handle Stripe error', async () => {
      const stripeError = {
        type: 'StripeInvalidRequestError',
        message: 'Customer not found',
        code: 'resource_missing',
      };
      mockStripe.customers.update.mockRejectedValue(stripeError);

      const result = await service.setDefaultPaymentMethod('cus_invalid', 'pm_123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Customer not found');
    });
  });
});
