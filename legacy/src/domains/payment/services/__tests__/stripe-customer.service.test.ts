import { describe, it, expect, vi, beforeEach } from 'vitest';

import { mockObjectId } from '../../../../../tests/helpers/objectid-helper';
import { StripeCustomerService } from '../stripe-customer.service';
import * as stripeConfig from '../../config/stripe.config';

// Mock the stripe config
vi.mock('../../config/stripe.config', () => ({
  getStripeClient: vi.fn(),
  STRIPE_METADATA_KEYS: {
    userId: 'myngly_user_id',
    platform: 'myngly_platform',
  },
}));

describe('StripeCustomerService', () => {
  let service: StripeCustomerService;
  let mockStripe: {
    customers: {
      create: ReturnType<typeof vi.fn>;
      retrieve: ReturnType<typeof vi.fn>;
      update: ReturnType<typeof vi.fn>;
    };
    setupIntents: {
      create: ReturnType<typeof vi.fn>;
    };
    paymentMethods: {
      list: ReturnType<typeof vi.fn>;
    };
  };

  const mockCustomer = {
    id: 'cus_123',
    email: 'test@example.com',
    name: 'Test User',
    phone: '1234567890',
    metadata: { myngly_user_id: mockObjectId(1) },
    deleted: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();

    mockStripe = {
      customers: {
        create: vi.fn(),
        retrieve: vi.fn(),
        update: vi.fn(),
      },
      setupIntents: {
        create: vi.fn(),
      },
      paymentMethods: {
        list: vi.fn(),
      },
    };

    vi.mocked(stripeConfig.getStripeClient).mockReturnValue(mockStripe as unknown as ReturnType<typeof stripeConfig.getStripeClient>);

    service = new StripeCustomerService();
  });

  describe('createCustomer', () => {
    const customerData = {
      userId: mockObjectId(1),
      email: 'test@example.com',
      name: 'Test User',
      phone: '1234567890',
    };

    it('should create customer successfully', async () => {
      mockStripe.customers.create.mockResolvedValue(mockCustomer);

      const result = await service.createCustomer(customerData);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockCustomer);
    });

    it('should include metadata with userId and platform', async () => {
      mockStripe.customers.create.mockResolvedValue(mockCustomer);

      await service.createCustomer(customerData);

      expect(mockStripe.customers.create).toHaveBeenCalledWith({
        email: 'test@example.com',
        name: 'Test User',
        phone: '1234567890',
        metadata: expect.objectContaining({
          myngly_user_id: mockObjectId(1),
          myngly_platform: 'myngly_ads',
        }),
      });
    });

    it('should handle Stripe error', async () => {
      const stripeError = {
        type: 'StripeCardError',
        message: 'Card declined',
        code: 'card_declined',
      };
      mockStripe.customers.create.mockRejectedValue(stripeError);

      const result = await service.createCustomer(customerData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Card declined');
      expect(result.stripeErrorCode).toBe('card_declined');
    });

    it('should handle generic error', async () => {
      mockStripe.customers.create.mockRejectedValue(new Error('Network error'));

      const result = await service.createCustomer(customerData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Network error');
    });

    it('should merge custom metadata', async () => {
      mockStripe.customers.create.mockResolvedValue(mockCustomer);

      await service.createCustomer({
        ...customerData,
        metadata: { custom_key: 'custom_value' },
      });

      expect(mockStripe.customers.create).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: expect.objectContaining({
            custom_key: 'custom_value',
          }),
        }),
      );
    });
  });

  describe('getCustomer', () => {
    it('should retrieve customer successfully', async () => {
      mockStripe.customers.retrieve.mockResolvedValue(mockCustomer);

      const result = await service.getCustomer('cus_123');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockCustomer);
    });

    it('should return error for deleted customer', async () => {
      mockStripe.customers.retrieve.mockResolvedValue({ ...mockCustomer, deleted: true });

      const result = await service.getCustomer('cus_123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Customer has been deleted');
    });

    it('should handle Stripe error', async () => {
      const stripeError = {
        type: 'StripeInvalidRequestError',
        message: 'Customer not found',
        code: 'resource_missing',
      };
      mockStripe.customers.retrieve.mockRejectedValue(stripeError);

      const result = await service.getCustomer('cus_invalid');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Customer not found');
    });
  });

  describe('updateCustomer', () => {
    it('should update customer successfully', async () => {
      const updatedCustomer = { ...mockCustomer, name: 'Updated Name' };
      mockStripe.customers.update.mockResolvedValue(updatedCustomer);

      const result = await service.updateCustomer('cus_123', { name: 'Updated Name' });

      expect(result.success).toBe(true);
      expect(result.data?.name).toBe('Updated Name');
    });

    it('should only include provided fields', async () => {
      mockStripe.customers.update.mockResolvedValue(mockCustomer);

      await service.updateCustomer('cus_123', { email: 'new@example.com' });

      expect(mockStripe.customers.update).toHaveBeenCalledWith('cus_123', {
        email: 'new@example.com',
      });
    });

    it('should handle Stripe error', async () => {
      const stripeError = {
        type: 'StripeInvalidRequestError',
        message: 'Invalid email',
        code: 'invalid_email',
      };
      mockStripe.customers.update.mockRejectedValue(stripeError);

      const result = await service.updateCustomer('cus_123', { email: 'invalid' });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid email');
    });
  });

  describe('createSetupIntent', () => {
    const mockSetupIntent = {
      id: 'seti_123',
      customer: 'cus_123',
      client_secret: 'seti_123_secret',
    };

    it('should create setup intent successfully', async () => {
      mockStripe.setupIntents.create.mockResolvedValue(mockSetupIntent);

      const result = await service.createSetupIntent('cus_123');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockSetupIntent);
    });

    it('should create setup intent with card payment method type', async () => {
      mockStripe.setupIntents.create.mockResolvedValue(mockSetupIntent);

      await service.createSetupIntent('cus_123');

      expect(mockStripe.setupIntents.create).toHaveBeenCalledWith({
        customer: 'cus_123',
        payment_method_types: ['card'],
      });
    });

    it('should handle Stripe error', async () => {
      const stripeError = {
        type: 'StripeInvalidRequestError',
        message: 'Customer not found',
        code: 'resource_missing',
      };
      mockStripe.setupIntents.create.mockRejectedValue(stripeError);

      const result = await service.createSetupIntent('cus_invalid');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Customer not found');
    });
  });

  describe('listPaymentMethods', () => {
    const mockPaymentMethods = {
      data: [
        { id: 'pm_123', type: 'card', card: { brand: 'visa', last4: '4242' } },
        { id: 'pm_456', type: 'card', card: { brand: 'mastercard', last4: '5555' } },
      ],
    };

    it('should list payment methods successfully', async () => {
      mockStripe.paymentMethods.list.mockResolvedValue(mockPaymentMethods);

      const result = await service.listPaymentMethods('cus_123');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockPaymentMethods.data);
    });

    it('should list only card payment methods', async () => {
      mockStripe.paymentMethods.list.mockResolvedValue(mockPaymentMethods);

      await service.listPaymentMethods('cus_123');

      expect(mockStripe.paymentMethods.list).toHaveBeenCalledWith({
        customer: 'cus_123',
        type: 'card',
      });
    });

    it('should handle Stripe error', async () => {
      const stripeError = {
        type: 'StripeInvalidRequestError',
        message: 'Customer not found',
        code: 'resource_missing',
      };
      mockStripe.paymentMethods.list.mockRejectedValue(stripeError);

      const result = await service.listPaymentMethods('cus_invalid');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Customer not found');
    });

    it('should return empty array when no payment methods', async () => {
      mockStripe.paymentMethods.list.mockResolvedValue({ data: [] });

      const result = await service.listPaymentMethods('cus_123');

      expect(result.success).toBe(true);
      expect(result.data).toEqual([]);
    });
  });
});
