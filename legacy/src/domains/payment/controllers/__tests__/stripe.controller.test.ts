import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request, Response, NextFunction } from 'express';

import { mockObjectId } from '../../../../../tests/helpers/objectid-helper';
import { StripeController } from '../stripe.controller';
import type { StripeCustomerService } from '../../services/stripe-customer.service';
import type { StripePaymentService } from '../../services/stripe-payment.service';
import type { StripeInvoiceService } from '../../services/stripe-invoice.service';

// Mock the response helper module
vi.mock('../../../../infrastructure/http/response.helper', () => ({
  success: vi.fn(),
  created: vi.fn(),
}));

import { success, created } from '../../../../infrastructure/http/response.helper';

describe('StripeController', () => {
  let controller: StripeController;
  let mockCustomerService: Partial<StripeCustomerService>;
  let mockPaymentService: Partial<StripePaymentService>;
  let mockInvoiceService: Partial<StripeInvoiceService>;
  let mockReq: Request;
  let mockRes: Response;
  let mockNext: NextFunction;

  beforeEach(() => {
    vi.clearAllMocks();

    mockCustomerService = {
      createCustomer: vi.fn(),
    };

    mockPaymentService = {
      createPaymentIntent: vi.fn(),
      confirmPayment: vi.fn(),
    };

    mockInvoiceService = {
      createInvoice: vi.fn(),
      listInvoices: vi.fn(),
      payInvoice: vi.fn(),
    };

    mockReq = {
      body: {},
      params: {},
      query: {},
      user: { sub: mockObjectId(1), email: 'test@example.com', role: 'advertiser', type: 'access' },
    } as unknown as Request;

    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    } as unknown as Response;

    mockNext = vi.fn();

    controller = new StripeController(
      mockCustomerService as StripeCustomerService,
      mockPaymentService as StripePaymentService,
      mockInvoiceService as StripeInvoiceService,
    );
  });

  describe('createCustomer', () => {
    const customerData = {
      email: 'customer@example.com',
      name: 'Test Customer',
      phone: '1234567890',
    };

    it('should call customerService.createCustomer with correct parameters', async () => {
      mockReq.body = customerData;
      vi.mocked(mockCustomerService.createCustomer!).mockResolvedValue({
        success: true,
        data: { id: 'cus_123', email: 'customer@example.com' },
      });

      await controller.createCustomer(mockReq, mockRes, mockNext);

      expect(mockCustomerService.createCustomer).toHaveBeenCalledWith({
        userId: mockObjectId(1),
        email: 'customer@example.com',
        name: 'Test Customer',
        phone: '1234567890',
      });
    });

    it('should call created helper on success', async () => {
      mockReq.body = customerData;
      const customerResult = { id: 'cus_123', email: 'customer@example.com' };
      vi.mocked(mockCustomerService.createCustomer!).mockResolvedValue({
        success: true,
        data: customerResult,
      });

      await controller.createCustomer(mockReq, mockRes, mockNext);

      expect(created).toHaveBeenCalledWith(mockRes, customerResult, 'Stripe customer created');
    });

    it('should return 400 when customer creation fails', async () => {
      mockReq.body = customerData;
      vi.mocked(mockCustomerService.createCustomer!).mockResolvedValue({
        success: false,
        error: 'Invalid email',
      });

      await controller.createCustomer(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ success: false, error: 'Invalid email' });
    });

    it('should call next with error on exception', async () => {
      mockReq.body = customerData;
      const error = new Error('Stripe API error');
      vi.mocked(mockCustomerService.createCustomer!).mockRejectedValue(error);

      await controller.createCustomer(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('createPaymentIntent', () => {
    const paymentData = {
      amount: 5000,
      currency: 'usd',
      paymentMethodId: 'pm_123',
      description: 'Campaign payment',
      savePaymentMethod: true,
    };

    it('should call paymentService.createPaymentIntent with correct parameters', async () => {
      mockReq.params = { customerId: 'cus_123' };
      mockReq.body = paymentData;
      vi.mocked(mockPaymentService.createPaymentIntent!).mockResolvedValue({
        success: true,
        data: { id: 'pi_123', clientSecret: 'secret_123' },
      });

      await controller.createPaymentIntent(mockReq, mockRes, mockNext);

      expect(mockPaymentService.createPaymentIntent).toHaveBeenCalledWith({
        customerId: 'cus_123',
        amount: 5000,
        currency: 'usd',
        paymentMethodId: 'pm_123',
        description: 'Campaign payment',
        savePaymentMethod: true,
      });
    });

    it('should call created helper on success', async () => {
      mockReq.params = { customerId: 'cus_123' };
      mockReq.body = paymentData;
      const intentResult = { id: 'pi_123', clientSecret: 'secret_123' };
      vi.mocked(mockPaymentService.createPaymentIntent!).mockResolvedValue({
        success: true,
        data: intentResult,
      });

      await controller.createPaymentIntent(mockReq, mockRes, mockNext);

      expect(created).toHaveBeenCalledWith(mockRes, intentResult, 'Payment intent created');
    });

    it('should return 400 when payment intent creation fails', async () => {
      mockReq.params = { customerId: 'cus_123' };
      mockReq.body = paymentData;
      vi.mocked(mockPaymentService.createPaymentIntent!).mockResolvedValue({
        success: false,
        error: 'Insufficient funds',
      });

      await controller.createPaymentIntent(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ success: false, error: 'Insufficient funds' });
    });

    it('should call next with error on exception', async () => {
      mockReq.params = { customerId: 'cus_123' };
      mockReq.body = paymentData;
      const error = new Error('Stripe API error');
      vi.mocked(mockPaymentService.createPaymentIntent!).mockRejectedValue(error);

      await controller.createPaymentIntent(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('confirmPayment', () => {
    const confirmData = {
      paymentIntentId: 'pi_123',
      paymentMethodId: 'pm_456',
    };

    it('should call paymentService.confirmPayment with correct parameters', async () => {
      mockReq.body = confirmData;
      vi.mocked(mockPaymentService.confirmPayment!).mockResolvedValue({
        success: true,
        data: { id: 'pi_123', status: 'succeeded' },
      });

      await controller.confirmPayment(mockReq, mockRes, mockNext);

      expect(mockPaymentService.confirmPayment).toHaveBeenCalledWith({
        paymentIntentId: 'pi_123',
        paymentMethodId: 'pm_456',
      });
    });

    it('should call success helper on success', async () => {
      mockReq.body = confirmData;
      const confirmResult = { id: 'pi_123', status: 'succeeded' };
      vi.mocked(mockPaymentService.confirmPayment!).mockResolvedValue({
        success: true,
        data: confirmResult,
      });

      await controller.confirmPayment(mockReq, mockRes, mockNext);

      expect(success).toHaveBeenCalledWith(mockRes, confirmResult, 'Payment confirmed');
    });

    it('should return 400 when payment confirmation fails', async () => {
      mockReq.body = confirmData;
      vi.mocked(mockPaymentService.confirmPayment!).mockResolvedValue({
        success: false,
        error: 'Card declined',
      });

      await controller.confirmPayment(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ success: false, error: 'Card declined' });
    });

    it('should call next with error on exception', async () => {
      mockReq.body = confirmData;
      const error = new Error('Stripe API error');
      vi.mocked(mockPaymentService.confirmPayment!).mockRejectedValue(error);

      await controller.confirmPayment(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('createInvoice', () => {
    const invoiceData = {
      items: [{ amount: 5000, description: 'Campaign budget' }],
      daysUntilDue: 30,
      autoAdvance: true,
      collectionMethod: 'charge_automatically',
    };

    it('should call invoiceService.createInvoice with correct parameters', async () => {
      mockReq.params = { customerId: 'cus_123' };
      mockReq.body = invoiceData;
      vi.mocked(mockInvoiceService.createInvoice!).mockResolvedValue({
        success: true,
        data: { id: 'in_123', status: 'draft' },
      });

      await controller.createInvoice(mockReq, mockRes, mockNext);

      expect(mockInvoiceService.createInvoice).toHaveBeenCalledWith({
        customerId: 'cus_123',
        items: [{ amount: 5000, description: 'Campaign budget' }],
        daysUntilDue: 30,
        autoAdvance: true,
        collectionMethod: 'charge_automatically',
      });
    });

    it('should call created helper on success', async () => {
      mockReq.params = { customerId: 'cus_123' };
      mockReq.body = invoiceData;
      const invoiceResult = { id: 'in_123', status: 'draft' };
      vi.mocked(mockInvoiceService.createInvoice!).mockResolvedValue({
        success: true,
        data: invoiceResult,
      });

      await controller.createInvoice(mockReq, mockRes, mockNext);

      expect(created).toHaveBeenCalledWith(mockRes, invoiceResult, 'Invoice created');
    });

    it('should return 400 when invoice creation fails', async () => {
      mockReq.params = { customerId: 'cus_123' };
      mockReq.body = invoiceData;
      vi.mocked(mockInvoiceService.createInvoice!).mockResolvedValue({
        success: false,
        error: 'Customer not found',
      });

      await controller.createInvoice(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it('should call next with error on exception', async () => {
      mockReq.params = { customerId: 'cus_123' };
      mockReq.body = invoiceData;
      const error = new Error('Stripe API error');
      vi.mocked(mockInvoiceService.createInvoice!).mockRejectedValue(error);

      await controller.createInvoice(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('listInvoices', () => {
    it('should call invoiceService.listInvoices with default limit', async () => {
      mockReq.query = {};
      vi.mocked(mockInvoiceService.listInvoices!).mockResolvedValue({
        success: true,
        data: [{ id: 'in_123' }],
      });

      await controller.listInvoices(mockReq, mockRes, mockNext);

      expect(mockInvoiceService.listInvoices).toHaveBeenCalledWith(undefined, { limit: 10 });
    });

    it('should use provided limit from query', async () => {
      mockReq.query = { limit: '25' };
      vi.mocked(mockInvoiceService.listInvoices!).mockResolvedValue({
        success: true,
        data: [],
      });

      await controller.listInvoices(mockReq, mockRes, mockNext);

      expect(mockInvoiceService.listInvoices).toHaveBeenCalledWith(undefined, { limit: 25 });
    });

    it('should call success helper on success', async () => {
      mockReq.query = {};
      const invoices = [{ id: 'in_123' }, { id: 'in_456' }];
      vi.mocked(mockInvoiceService.listInvoices!).mockResolvedValue({
        success: true,
        data: invoices,
      });

      await controller.listInvoices(mockReq, mockRes, mockNext);

      expect(success).toHaveBeenCalledWith(mockRes, invoices);
    });

    it('should return 400 when listing fails', async () => {
      mockReq.query = {};
      vi.mocked(mockInvoiceService.listInvoices!).mockResolvedValue({
        success: false,
        error: 'Failed to fetch invoices',
      });

      await controller.listInvoices(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it('should call next with error on exception', async () => {
      mockReq.query = {};
      const error = new Error('Stripe API error');
      vi.mocked(mockInvoiceService.listInvoices!).mockRejectedValue(error);

      await controller.listInvoices(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('payInvoice', () => {
    it('should call invoiceService.payInvoice with invoice id and payment method', async () => {
      mockReq.params = { id: 'in_123' };
      mockReq.body = { paymentMethodId: 'pm_456' };
      vi.mocked(mockInvoiceService.payInvoice!).mockResolvedValue({
        success: true,
        data: { id: 'in_123', status: 'paid' },
      });

      await controller.payInvoice(mockReq, mockRes, mockNext);

      expect(mockInvoiceService.payInvoice).toHaveBeenCalledWith('in_123', 'pm_456');
    });

    it('should call success helper on success', async () => {
      mockReq.params = { id: 'in_123' };
      mockReq.body = { paymentMethodId: 'pm_456' };
      const paidInvoice = { id: 'in_123', status: 'paid' };
      vi.mocked(mockInvoiceService.payInvoice!).mockResolvedValue({
        success: true,
        data: paidInvoice,
      });

      await controller.payInvoice(mockReq, mockRes, mockNext);

      expect(success).toHaveBeenCalledWith(mockRes, paidInvoice, 'Invoice paid');
    });

    it('should return 400 when payment fails', async () => {
      mockReq.params = { id: 'in_123' };
      mockReq.body = { paymentMethodId: 'pm_456' };
      vi.mocked(mockInvoiceService.payInvoice!).mockResolvedValue({
        success: false,
        error: 'Payment failed',
      });

      await controller.payInvoice(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it('should call next with error on exception', async () => {
      mockReq.params = { id: 'in_123' };
      mockReq.body = { paymentMethodId: 'pm_456' };
      const error = new Error('Stripe API error');
      vi.mocked(mockInvoiceService.payInvoice!).mockRejectedValue(error);

      await controller.payInvoice(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });
});
