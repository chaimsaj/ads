import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { PaymentMethod } from '@prisma/client';

import { mockObjectId } from '../../../../../tests/helpers/objectid-helper';
import type { IPaymentMethodRepository } from '../../interfaces/payment-method-repository.interface';
import type { CreatePaymentMethodData } from '../../types/payment.types';
import { PaymentMethodService } from '../payment-method.service';

// ---------------------------------------------------------------------------
// Mock factories
// ---------------------------------------------------------------------------

function createMockPaymentMethod(overrides: Partial<PaymentMethod> = {}): PaymentMethod {
  return {
    id: mockObjectId(1),
    userId: mockObjectId(10),
    cardType: 'visa',
    lastFour: '4242',
    expiryMonth: 12,
    expiryYear: 2027,
    cardholderName: 'Jane Doe',
    isDefault: false,
    stripePaymentMethodId: 'pm_test_123',
    stripeCustomerId: 'cus_test_456',
    createdAt: new Date('2025-01-15T00:00:00.000Z'),
    updatedAt: new Date('2025-01-15T00:00:00.000Z'),
    ...overrides,
  };
}

function createMockPaymentMethodRepo(): IPaymentMethodRepository {
  return {
    findById: vi.fn().mockResolvedValue(null),
    findByIdForUser: vi.fn().mockResolvedValue(null),
    findAllForUser: vi.fn().mockResolvedValue([]),
    findDefaultForUser: vi.fn().mockResolvedValue(null),
    create: vi.fn().mockImplementation((data: CreatePaymentMethodData) =>
      Promise.resolve(
        createMockPaymentMethod({
          userId: data.userId,
          cardType: data.cardType,
          lastFour: data.lastFour,
          expiryMonth: data.expiryMonth,
          expiryYear: data.expiryYear,
          cardholderName: data.cardholderName,
          isDefault: data.isDefault ?? false,
          stripePaymentMethodId: data.stripePaymentMethodId ?? null,
        }),
      ),
    ),
    delete: vi.fn().mockResolvedValue(undefined),
    setAsDefault: vi.fn().mockImplementation((id: string, _userId: string) =>
      Promise.resolve(createMockPaymentMethod({ id, isDefault: true })),
    ),
    countForUser: vi.fn().mockResolvedValue(0),
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('PaymentMethodService', () => {
  let service: PaymentMethodService;
  let paymentMethodRepo: IPaymentMethodRepository;

  beforeEach(() => {
    paymentMethodRepo = createMockPaymentMethodRepo();
    service = new PaymentMethodService(paymentMethodRepo);
  });

  // -----------------------------------------------------------------------
  // getPaymentMethods
  // -----------------------------------------------------------------------

  describe('getPaymentMethods', () => {
    it('should return mapped DTOs for user payment methods', async () => {
      const mockMethods = [
        createMockPaymentMethod({ id: mockObjectId(1), isDefault: true }),
        createMockPaymentMethod({ id: mockObjectId(2), cardType: 'mastercard', lastFour: '5555', isDefault: false }),
      ];
      (paymentMethodRepo.findAllForUser as ReturnType<typeof vi.fn>).mockResolvedValue(mockMethods);

      const result = await service.getPaymentMethods(mockObjectId(10));

      expect(paymentMethodRepo.findAllForUser).toHaveBeenCalledWith(mockObjectId(10));
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: mockObjectId(1),
        cardType: 'visa',
        lastFour: '4242',
        expiryMonth: 12,
        expiryYear: 2027,
        cardholderName: 'Jane Doe',
        isDefault: true,
        stripePaymentMethodId: 'pm_test_123',
        createdAt: new Date('2025-01-15T00:00:00.000Z'),
      });
      expect(result[1]).toEqual({
        id: mockObjectId(2),
        cardType: 'mastercard',
        lastFour: '5555',
        expiryMonth: 12,
        expiryYear: 2027,
        cardholderName: 'Jane Doe',
        isDefault: false,
        stripePaymentMethodId: 'pm_test_123',
        createdAt: new Date('2025-01-15T00:00:00.000Z'),
      });
    });

    it('should return empty array when user has no payment methods', async () => {
      const result = await service.getPaymentMethods(mockObjectId(10));

      expect(paymentMethodRepo.findAllForUser).toHaveBeenCalledWith(mockObjectId(10));
      expect(result).toEqual([]);
    });

    it('should not include updatedAt or userId in the returned DTOs', async () => {
      (paymentMethodRepo.findAllForUser as ReturnType<typeof vi.fn>).mockResolvedValue([
        createMockPaymentMethod(),
      ]);

      const result = await service.getPaymentMethods(mockObjectId(10));

      expect(result[0]).not.toHaveProperty('updatedAt');
      expect(result[0]).not.toHaveProperty('userId');
    });
  });

  // -----------------------------------------------------------------------
  // addPaymentMethod
  // -----------------------------------------------------------------------

  describe('addPaymentMethod', () => {
    const baseData: CreatePaymentMethodData = {
      userId: mockObjectId(10),
      cardType: 'visa',
      lastFour: '4242',
      expiryMonth: 12,
      expiryYear: 2027,
      cardholderName: 'Jane Doe',
      stripePaymentMethodId: 'pm_test_123',
    };

    it('should auto-default the first payment method for a user', async () => {
      (paymentMethodRepo.countForUser as ReturnType<typeof vi.fn>).mockResolvedValue(0);

      await service.addPaymentMethod(baseData);

      expect(paymentMethodRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ isDefault: true }),
      );
    });

    it('should respect isDefault flag when user already has methods', async () => {
      (paymentMethodRepo.countForUser as ReturnType<typeof vi.fn>).mockResolvedValue(3);

      await service.addPaymentMethod({ ...baseData, isDefault: false });

      expect(paymentMethodRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ isDefault: false }),
      );
    });

    it('should allow setting isDefault true for subsequent methods', async () => {
      (paymentMethodRepo.countForUser as ReturnType<typeof vi.fn>).mockResolvedValue(2);

      await service.addPaymentMethod({ ...baseData, isDefault: true });

      expect(paymentMethodRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ isDefault: true }),
      );
    });

    it('should return a PaymentMethodDTO after creation', async () => {
      (paymentMethodRepo.countForUser as ReturnType<typeof vi.fn>).mockResolvedValue(0);

      const result = await service.addPaymentMethod(baseData);

      expect(result).toEqual({
        id: mockObjectId(1),
        cardType: 'visa',
        lastFour: '4242',
        expiryMonth: 12,
        expiryYear: 2027,
        cardholderName: 'Jane Doe',
        isDefault: true,
        stripePaymentMethodId: 'pm_test_123',
        createdAt: expect.any(Date),
      });
    });

    it('should throw ValidationError when user has 10 payment methods', async () => {
      (paymentMethodRepo.countForUser as ReturnType<typeof vi.fn>).mockResolvedValue(10);

      await expect(service.addPaymentMethod(baseData)).rejects.toThrow('Validation failed');

      expect(paymentMethodRepo.create).not.toHaveBeenCalled();
    });

    it('should throw ValidationError when user exceeds 10 payment methods', async () => {
      (paymentMethodRepo.countForUser as ReturnType<typeof vi.fn>).mockResolvedValue(15);

      await expect(service.addPaymentMethod(baseData)).rejects.toThrow('Validation failed');

      expect(paymentMethodRepo.create).not.toHaveBeenCalled();
    });
  });

  // -----------------------------------------------------------------------
  // removePaymentMethod
  // -----------------------------------------------------------------------

  describe('removePaymentMethod', () => {
    it('should delete a non-default payment method', async () => {
      (paymentMethodRepo.findByIdForUser as ReturnType<typeof vi.fn>).mockResolvedValue(
        createMockPaymentMethod({ id: mockObjectId(5), isDefault: false }),
      );

      await service.removePaymentMethod(mockObjectId(5), mockObjectId(10));

      expect(paymentMethodRepo.findByIdForUser).toHaveBeenCalledWith(mockObjectId(5), mockObjectId(10));
      expect(paymentMethodRepo.delete).toHaveBeenCalledWith(mockObjectId(5));
    });

    it('should throw NotFoundError when payment method does not exist', async () => {
      await expect(service.removePaymentMethod(mockObjectId(999), mockObjectId(10))).rejects.toThrow('Payment method not found');

      expect(paymentMethodRepo.delete).not.toHaveBeenCalled();
    });

    it('should throw ValidationError when trying to remove default payment method', async () => {
      (paymentMethodRepo.findByIdForUser as ReturnType<typeof vi.fn>).mockResolvedValue(
        createMockPaymentMethod({ id: mockObjectId(5), isDefault: true }),
      );

      await expect(service.removePaymentMethod(mockObjectId(5), mockObjectId(10))).rejects.toThrow('Validation failed');

      expect(paymentMethodRepo.delete).not.toHaveBeenCalled();
    });
  });

  // -----------------------------------------------------------------------
  // setAsDefault
  // -----------------------------------------------------------------------

  describe('setAsDefault', () => {
    it('should set the payment method as default and return updated DTO', async () => {
      (paymentMethodRepo.findByIdForUser as ReturnType<typeof vi.fn>).mockResolvedValue(
        createMockPaymentMethod({ id: mockObjectId(3), isDefault: false }),
      );

      const result = await service.setAsDefault(mockObjectId(3), mockObjectId(10));

      expect(paymentMethodRepo.findByIdForUser).toHaveBeenCalledWith(mockObjectId(3), mockObjectId(10));
      expect(paymentMethodRepo.setAsDefault).toHaveBeenCalledWith(mockObjectId(3), mockObjectId(10));
      expect(result.isDefault).toBe(true);
      expect(result.id).toBe(mockObjectId(3));
      expect(result).toEqual({
        id: mockObjectId(3),
        cardType: 'visa',
        lastFour: '4242',
        expiryMonth: 12,
        expiryYear: 2027,
        cardholderName: 'Jane Doe',
        isDefault: true,
        stripePaymentMethodId: 'pm_test_123',
        createdAt: expect.any(Date),
      });
    });

    it('should throw NotFoundError when payment method does not exist', async () => {
      await expect(service.setAsDefault(mockObjectId(999), mockObjectId(10))).rejects.toThrow('Payment method not found');

      expect(paymentMethodRepo.setAsDefault).not.toHaveBeenCalled();
    });
  });
});
