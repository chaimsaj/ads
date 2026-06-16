import { describe, it, expect, vi, beforeEach } from 'vitest';

import { StripeInvoiceService } from '../stripe-invoice.service';
import * as stripeConfig from '../../config/stripe.config';

// Mock the stripe config
vi.mock('../../config/stripe.config', () => ({
  getStripeClient: vi.fn(),
}));

describe('StripeInvoiceService', () => {
  let service: StripeInvoiceService;
  let mockStripe: {
    invoices: {
      create: ReturnType<typeof vi.fn>;
      list: ReturnType<typeof vi.fn>;
      retrieve: ReturnType<typeof vi.fn>;
      pay: ReturnType<typeof vi.fn>;
      finalizeInvoice: ReturnType<typeof vi.fn>;
      voidInvoice: ReturnType<typeof vi.fn>;
    };
    invoiceItems: {
      create: ReturnType<typeof vi.fn>;
    };
  };

  const mockInvoice = {
    id: 'in_123',
    customer: 'cus_123',
    status: 'draft',
    total: 5000,
    currency: 'usd',
    collection_method: 'charge_automatically',
  };

  beforeEach(() => {
    vi.clearAllMocks();

    mockStripe = {
      invoices: {
        create: vi.fn(),
        list: vi.fn(),
        retrieve: vi.fn(),
        pay: vi.fn(),
        finalizeInvoice: vi.fn(),
        voidInvoice: vi.fn(),
      },
      invoiceItems: {
        create: vi.fn(),
      },
    };

    vi.mocked(stripeConfig.getStripeClient).mockReturnValue(mockStripe as unknown as ReturnType<typeof stripeConfig.getStripeClient>);

    service = new StripeInvoiceService();
  });

  describe('createInvoice', () => {
    const invoiceData = {
      customerId: 'cus_123',
      items: [
        { description: 'Ad Campaign', amount: 5000 },
      ],
    };

    it('should create invoice successfully', async () => {
      mockStripe.invoices.create.mockResolvedValue(mockInvoice);
      mockStripe.invoiceItems.create.mockResolvedValue({});

      const result = await service.createInvoice(invoiceData);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockInvoice);
    });

    it('should create invoice with correct parameters', async () => {
      mockStripe.invoices.create.mockResolvedValue(mockInvoice);
      mockStripe.invoiceItems.create.mockResolvedValue({});

      await service.createInvoice(invoiceData);

      expect(mockStripe.invoices.create).toHaveBeenCalledWith({
        customer: 'cus_123',
        collection_method: 'charge_automatically',
        days_until_due: undefined,
        auto_advance: true,
        metadata: undefined,
      });
    });

    it('should create invoice items for each item', async () => {
      mockStripe.invoices.create.mockResolvedValue(mockInvoice);
      mockStripe.invoiceItems.create.mockResolvedValue({});

      await service.createInvoice({
        customerId: 'cus_123',
        items: [
          { description: 'Item 1', amount: 2000 },
          { description: 'Item 2', amount: 3000, quantity: 2 },
        ],
      });

      expect(mockStripe.invoiceItems.create).toHaveBeenCalledTimes(2);
      expect(mockStripe.invoiceItems.create).toHaveBeenCalledWith({
        customer: 'cus_123',
        invoice: 'in_123',
        description: 'Item 1',
        amount: 2000,
      });
      expect(mockStripe.invoiceItems.create).toHaveBeenCalledWith({
        customer: 'cus_123',
        invoice: 'in_123',
        description: 'Item 2',
        amount: 6000,
      });
    });

    it('should set days_until_due for send_invoice collection method', async () => {
      mockStripe.invoices.create.mockResolvedValue(mockInvoice);
      mockStripe.invoiceItems.create.mockResolvedValue({});

      await service.createInvoice({
        ...invoiceData,
        collectionMethod: 'send_invoice',
        daysUntilDue: 15,
      });

      expect(mockStripe.invoices.create).toHaveBeenCalledWith(
        expect.objectContaining({
          collection_method: 'send_invoice',
          days_until_due: 15,
        }),
      );
    });

    it('should use default days_until_due of 30 for send_invoice', async () => {
      mockStripe.invoices.create.mockResolvedValue(mockInvoice);
      mockStripe.invoiceItems.create.mockResolvedValue({});

      await service.createInvoice({
        ...invoiceData,
        collectionMethod: 'send_invoice',
      });

      expect(mockStripe.invoices.create).toHaveBeenCalledWith(
        expect.objectContaining({
          days_until_due: 30,
        }),
      );
    });

    it('should handle Stripe error', async () => {
      const stripeError = {
        type: 'StripeInvalidRequestError',
        message: 'Customer not found',
        code: 'resource_missing',
      };
      mockStripe.invoices.create.mockRejectedValue(stripeError);

      const result = await service.createInvoice(invoiceData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Customer not found');
      expect(result.stripeErrorCode).toBe('resource_missing');
    });
  });

  describe('listInvoices', () => {
    const mockInvoicesList = {
      data: [mockInvoice, { ...mockInvoice, id: 'in_456' }],
    };

    it('should list invoices successfully', async () => {
      mockStripe.invoices.list.mockResolvedValue(mockInvoicesList);

      const result = await service.listInvoices();

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockInvoicesList.data);
    });

    it('should filter by customer when provided', async () => {
      mockStripe.invoices.list.mockResolvedValue(mockInvoicesList);

      await service.listInvoices('cus_123');

      expect(mockStripe.invoices.list).toHaveBeenCalledWith(
        expect.objectContaining({
          customer: 'cus_123',
        }),
      );
    });

    it('should filter by status when provided', async () => {
      mockStripe.invoices.list.mockResolvedValue(mockInvoicesList);

      await service.listInvoices('cus_123', { status: 'paid' });

      expect(mockStripe.invoices.list).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'paid',
        }),
      );
    });

    it('should use custom limit when provided', async () => {
      mockStripe.invoices.list.mockResolvedValue(mockInvoicesList);

      await service.listInvoices(undefined, { limit: 50 });

      expect(mockStripe.invoices.list).toHaveBeenCalledWith(
        expect.objectContaining({
          limit: 50,
        }),
      );
    });

    it('should use startingAfter for pagination', async () => {
      mockStripe.invoices.list.mockResolvedValue(mockInvoicesList);

      await service.listInvoices(undefined, { startingAfter: 'in_100' });

      expect(mockStripe.invoices.list).toHaveBeenCalledWith(
        expect.objectContaining({
          starting_after: 'in_100',
        }),
      );
    });

    it('should handle Stripe error', async () => {
      const stripeError = {
        type: 'StripeInvalidRequestError',
        message: 'Invalid request',
        code: 'invalid_request',
      };
      mockStripe.invoices.list.mockRejectedValue(stripeError);

      const result = await service.listInvoices();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid request');
    });
  });

  describe('getInvoice', () => {
    it('should retrieve invoice successfully', async () => {
      mockStripe.invoices.retrieve.mockResolvedValue(mockInvoice);

      const result = await service.getInvoice('in_123');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockInvoice);
    });

    it('should handle Stripe error', async () => {
      const stripeError = {
        type: 'StripeInvalidRequestError',
        message: 'Invoice not found',
        code: 'resource_missing',
      };
      mockStripe.invoices.retrieve.mockRejectedValue(stripeError);

      const result = await service.getInvoice('in_invalid');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invoice not found');
    });
  });

  describe('payInvoice', () => {
    it('should pay invoice successfully', async () => {
      const paidInvoice = { ...mockInvoice, status: 'paid' };
      mockStripe.invoices.pay.mockResolvedValue(paidInvoice);

      const result = await service.payInvoice('in_123');

      expect(result.success).toBe(true);
      expect(result.data?.status).toBe('paid');
    });

    it('should include payment method when provided', async () => {
      mockStripe.invoices.pay.mockResolvedValue(mockInvoice);

      await service.payInvoice('in_123', 'pm_456');

      expect(mockStripe.invoices.pay).toHaveBeenCalledWith('in_123', {
        payment_method: 'pm_456',
      });
    });

    it('should handle Stripe error', async () => {
      const stripeError = {
        type: 'StripeCardError',
        message: 'Card declined',
        code: 'card_declined',
      };
      mockStripe.invoices.pay.mockRejectedValue(stripeError);

      const result = await service.payInvoice('in_123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Card declined');
    });
  });

  describe('finalizeInvoice', () => {
    it('should finalize invoice successfully', async () => {
      const finalizedInvoice = { ...mockInvoice, status: 'open' };
      mockStripe.invoices.finalizeInvoice.mockResolvedValue(finalizedInvoice);

      const result = await service.finalizeInvoice('in_123');

      expect(result.success).toBe(true);
      expect(result.data?.status).toBe('open');
    });

    it('should handle Stripe error', async () => {
      const stripeError = {
        type: 'StripeInvalidRequestError',
        message: 'Invoice already finalized',
        code: 'invoice_finalized',
      };
      mockStripe.invoices.finalizeInvoice.mockRejectedValue(stripeError);

      const result = await service.finalizeInvoice('in_123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invoice already finalized');
    });
  });

  describe('voidInvoice', () => {
    it('should void invoice successfully', async () => {
      const voidedInvoice = { ...mockInvoice, status: 'void' };
      mockStripe.invoices.voidInvoice.mockResolvedValue(voidedInvoice);

      const result = await service.voidInvoice('in_123');

      expect(result.success).toBe(true);
      expect(result.data?.status).toBe('void');
    });

    it('should handle Stripe error', async () => {
      const stripeError = {
        type: 'StripeInvalidRequestError',
        message: 'Cannot void paid invoice',
        code: 'invoice_paid',
      };
      mockStripe.invoices.voidInvoice.mockRejectedValue(stripeError);

      const result = await service.voidInvoice('in_123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Cannot void paid invoice');
    });
  });
});
