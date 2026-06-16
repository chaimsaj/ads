import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request, Response, NextFunction } from 'express';

import { mockObjectId } from '../../../../../tests/helpers/objectid-helper';
import { PaymentController } from '../payment.controller';
import type { PaymentMethodService } from '../../services/payment-method.service';

// Mock the response helper module
vi.mock('../../../../infrastructure/http/response.helper', () => ({
  success: vi.fn(),
  created: vi.fn(),
  noContent: vi.fn(),
}));

import { success, created, noContent } from '../../../../infrastructure/http/response.helper';

describe('PaymentController', () => {
  let controller: PaymentController;
  let mockPaymentService: Partial<PaymentMethodService>;
  let mockReq: Request;
  let mockRes: Response;
  let mockNext: NextFunction;

  const mockPaymentMethod = {
    id: mockObjectId(1),
    userId: mockObjectId(1),
    cardType: 'VISA',
    lastFour: '4242',
    expiryMonth: 12,
    expiryYear: 2025,
    cardholderName: 'John Doe',
    isDefault: true,
    stripePaymentMethodId: 'pm_123',
    createdAt: new Date(),
  };

  beforeEach(() => {
    vi.clearAllMocks();

    mockPaymentService = {
      getPaymentMethods: vi.fn(),
      addPaymentMethod: vi.fn(),
      removePaymentMethod: vi.fn(),
      setAsDefault: vi.fn(),
    };

    mockReq = {
      body: {},
      params: {},
      user: { sub: mockObjectId(1), email: 'test@example.com', role: 'advertiser', type: 'access' },
    } as unknown as Request;

    mockRes = {} as Response;

    mockNext = vi.fn();

    controller = new PaymentController(mockPaymentService as PaymentMethodService);
  });

  describe('listMethods', () => {
    it('should call paymentService.getPaymentMethods with user id', async () => {
      const methods = [mockPaymentMethod];
      vi.mocked(mockPaymentService.getPaymentMethods!).mockResolvedValue(methods);

      await controller.listMethods(mockReq, mockRes, mockNext);

      expect(mockPaymentService.getPaymentMethods).toHaveBeenCalledWith(mockObjectId(1));
    });

    it('should call success helper on success', async () => {
      const methods = [mockPaymentMethod];
      vi.mocked(mockPaymentService.getPaymentMethods!).mockResolvedValue(methods);

      await controller.listMethods(mockReq, mockRes, mockNext);

      expect(success).toHaveBeenCalledWith(mockRes, methods);
    });

    it('should call next with error on failure', async () => {
      const error = new Error('Failed to fetch payment methods');
      vi.mocked(mockPaymentService.getPaymentMethods!).mockRejectedValue(error);

      await controller.listMethods(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });

    it('should return empty array when user has no payment methods', async () => {
      vi.mocked(mockPaymentService.getPaymentMethods!).mockResolvedValue([]);

      await controller.listMethods(mockReq, mockRes, mockNext);

      expect(success).toHaveBeenCalledWith(mockRes, []);
    });
  });

  describe('addMethod', () => {
    const addMethodData = {
      cardType: 'VISA',
      lastFour: '1234',
      expiryMonth: 6,
      expiryYear: 2026,
      cardholderName: 'Jane Doe',
      setAsDefault: true,
      stripePaymentMethodId: 'pm_456',
    };

    it('should call paymentService.addPaymentMethod with correct parameters', async () => {
      mockReq.body = addMethodData;
      vi.mocked(mockPaymentService.addPaymentMethod!).mockResolvedValue(mockPaymentMethod);

      await controller.addMethod(mockReq, mockRes, mockNext);

      expect(mockPaymentService.addPaymentMethod).toHaveBeenCalledWith({
        userId: mockObjectId(1),
        cardType: 'VISA',
        lastFour: '1234',
        expiryMonth: 6,
        expiryYear: 2026,
        cardholderName: 'Jane Doe',
        isDefault: true,
        stripePaymentMethodId: 'pm_456',
      });
    });

    it('should call created helper on success', async () => {
      mockReq.body = addMethodData;
      vi.mocked(mockPaymentService.addPaymentMethod!).mockResolvedValue(mockPaymentMethod);

      await controller.addMethod(mockReq, mockRes, mockNext);

      expect(created).toHaveBeenCalledWith(mockRes, mockPaymentMethod, 'Payment method added');
    });

    it('should call next with error on failure', async () => {
      mockReq.body = addMethodData;
      const error = new Error('Invalid card');
      vi.mocked(mockPaymentService.addPaymentMethod!).mockRejectedValue(error);

      await controller.addMethod(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });

    it('should handle setAsDefault as false', async () => {
      mockReq.body = { ...addMethodData, setAsDefault: false };
      vi.mocked(mockPaymentService.addPaymentMethod!).mockResolvedValue(mockPaymentMethod);

      await controller.addMethod(mockReq, mockRes, mockNext);

      expect(mockPaymentService.addPaymentMethod).toHaveBeenCalledWith(
        expect.objectContaining({ isDefault: false }),
      );
    });
  });

  describe('removeMethod', () => {
    it('should call paymentService.removePaymentMethod with id and user id', async () => {
      mockReq.params = { id: mockObjectId(5) };
      vi.mocked(mockPaymentService.removePaymentMethod!).mockResolvedValue();

      await controller.removeMethod(mockReq, mockRes, mockNext);

      expect(mockPaymentService.removePaymentMethod).toHaveBeenCalledWith(mockObjectId(5), mockObjectId(1));
    });

    it('should call noContent helper on success', async () => {
      mockReq.params = { id: mockObjectId(5) };
      vi.mocked(mockPaymentService.removePaymentMethod!).mockResolvedValue();

      await controller.removeMethod(mockReq, mockRes, mockNext);

      expect(noContent).toHaveBeenCalledWith(mockRes);
    });

    it('should call next with error on failure', async () => {
      mockReq.params = { id: mockObjectId(5) };
      const error = new Error('Cannot remove default payment method');
      vi.mocked(mockPaymentService.removePaymentMethod!).mockRejectedValue(error);

      await controller.removeMethod(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });

    it('should pass id as string', async () => {
      mockReq.params = { id: mockObjectId(123) };
      vi.mocked(mockPaymentService.removePaymentMethod!).mockResolvedValue();

      await controller.removeMethod(mockReq, mockRes, mockNext);

      expect(mockPaymentService.removePaymentMethod).toHaveBeenCalledWith(mockObjectId(123), mockObjectId(1));
    });
  });

  describe('setDefault', () => {
    it('should call paymentService.setAsDefault with id and user id', async () => {
      mockReq.params = { id: mockObjectId(5) };
      vi.mocked(mockPaymentService.setAsDefault!).mockResolvedValue(mockPaymentMethod);

      await controller.setDefault(mockReq, mockRes, mockNext);

      expect(mockPaymentService.setAsDefault).toHaveBeenCalledWith(mockObjectId(5), mockObjectId(1));
    });

    it('should call success helper with message on success', async () => {
      mockReq.params = { id: mockObjectId(5) };
      vi.mocked(mockPaymentService.setAsDefault!).mockResolvedValue(mockPaymentMethod);

      await controller.setDefault(mockReq, mockRes, mockNext);

      expect(success).toHaveBeenCalledWith(
        mockRes,
        mockPaymentMethod,
        'Default payment method updated',
      );
    });

    it('should call next with error on failure', async () => {
      mockReq.params = { id: mockObjectId(5) };
      const error = new Error('Payment method not found');
      vi.mocked(mockPaymentService.setAsDefault!).mockRejectedValue(error);

      await controller.setDefault(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });

    it('should pass id as string', async () => {
      mockReq.params = { id: mockObjectId(99) };
      vi.mocked(mockPaymentService.setAsDefault!).mockResolvedValue(mockPaymentMethod);

      await controller.setDefault(mockReq, mockRes, mockNext);

      expect(mockPaymentService.setAsDefault).toHaveBeenCalledWith(mockObjectId(99), mockObjectId(1));
    });
  });

  describe('user context', () => {
    it('should use correct user id for all operations', async () => {
      mockReq.user = { sub: mockObjectId(42), email: 'other@example.com', role: 'advertiser', type: 'access' };
      vi.mocked(mockPaymentService.getPaymentMethods!).mockResolvedValue([]);

      await controller.listMethods(mockReq, mockRes, mockNext);

      expect(mockPaymentService.getPaymentMethods).toHaveBeenCalledWith(mockObjectId(42));
    });
  });
});
