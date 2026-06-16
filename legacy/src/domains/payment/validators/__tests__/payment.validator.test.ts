import { describe, it, expect } from 'vitest';

import {
  addPaymentMethodSchema,
  createPaymentIntentSchema,
  createRefundSchema,
} from '../payment.validator';

describe('Payment Validators', () => {
  describe('addPaymentMethodSchema', () => {
    const validPaymentMethod = {
      stripePaymentMethodId: 'pm_1234567890',
      cardholderName: 'John Doe',
      cardType: 'visa',
      lastFour: '4242',
      expiryMonth: 12,
      expiryYear: new Date().getFullYear() + 1,
    };

    it('should accept valid payment method data', () => {
      const result = addPaymentMethodSchema.safeParse(validPaymentMethod);
      expect(result.success).toBe(true);
    });

    it('should default setAsDefault to false', () => {
      const result = addPaymentMethodSchema.safeParse(validPaymentMethod);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.setAsDefault).toBe(false);
      }
    });

    it('should accept setAsDefault as true', () => {
      const result = addPaymentMethodSchema.safeParse({
        ...validPaymentMethod,
        setAsDefault: true,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.setAsDefault).toBe(true);
      }
    });

    it('should reject empty stripePaymentMethodId', () => {
      const result = addPaymentMethodSchema.safeParse({
        ...validPaymentMethod,
        stripePaymentMethodId: '',
      });
      expect(result.success).toBe(false);
    });

    it('should reject lastFour with wrong length', () => {
      const result = addPaymentMethodSchema.safeParse({
        ...validPaymentMethod,
        lastFour: '42',
      });
      expect(result.success).toBe(false);
    });

    it('should reject lastFour that is too long', () => {
      const result = addPaymentMethodSchema.safeParse({
        ...validPaymentMethod,
        lastFour: '42424',
      });
      expect(result.success).toBe(false);
    });

    it('should reject expiryMonth outside 1-12 range', () => {
      const result = addPaymentMethodSchema.safeParse({
        ...validPaymentMethod,
        expiryMonth: 13,
      });
      expect(result.success).toBe(false);
    });

    it('should reject expiryYear in the past', () => {
      const result = addPaymentMethodSchema.safeParse({
        ...validPaymentMethod,
        expiryYear: 2020,
      });
      expect(result.success).toBe(false);
    });
  });

  describe('createPaymentIntentSchema', () => {
    it('should accept valid payment intent', () => {
      const result = createPaymentIntentSchema.safeParse({
        amount: 5000,
        currency: 'usd',
      });
      expect(result.success).toBe(true);
    });

    it('should default currency to usd', () => {
      const result = createPaymentIntentSchema.safeParse({ amount: 1000 });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.currency).toBe('usd');
      }
    });

    it('should default savePaymentMethod to false', () => {
      const result = createPaymentIntentSchema.safeParse({ amount: 1000 });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.savePaymentMethod).toBe(false);
      }
    });

    it('should accept optional fields', () => {
      const result = createPaymentIntentSchema.safeParse({
        amount: 2500,
        currency: 'eur',
        paymentMethodId: 'pm_abc123',
        description: 'Campaign payment',
        savePaymentMethod: true,
      });
      expect(result.success).toBe(true);
    });

    it('should reject non-positive amount', () => {
      const result = createPaymentIntentSchema.safeParse({ amount: 0 });
      expect(result.success).toBe(false);
    });

    it('should reject negative amount', () => {
      const result = createPaymentIntentSchema.safeParse({ amount: -100 });
      expect(result.success).toBe(false);
    });

    it('should reject currency with wrong length', () => {
      const result = createPaymentIntentSchema.safeParse({
        amount: 1000,
        currency: 'us',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('createRefundSchema', () => {
    it('should accept valid full refund (no amount)', () => {
      const result = createRefundSchema.safeParse({
        paymentIntentId: 'pi_abc123',
      });
      expect(result.success).toBe(true);
    });

    it('should accept valid partial refund with reason', () => {
      const result = createRefundSchema.safeParse({
        paymentIntentId: 'pi_abc123',
        amount: 500,
        reason: 'duplicate',
      });
      expect(result.success).toBe(true);
    });

    it('should accept all valid reason types', () => {
      const reasons = ['duplicate', 'fraudulent', 'requested_by_customer'] as const;
      for (const reason of reasons) {
        const result = createRefundSchema.safeParse({
          paymentIntentId: 'pi_test',
          reason,
        });
        expect(result.success).toBe(true);
      }
    });

    it('should reject empty paymentIntentId', () => {
      const result = createRefundSchema.safeParse({ paymentIntentId: '' });
      expect(result.success).toBe(false);
    });

    it('should reject missing paymentIntentId', () => {
      const result = createRefundSchema.safeParse({ amount: 500 });
      expect(result.success).toBe(false);
    });

    it('should reject invalid reason', () => {
      const result = createRefundSchema.safeParse({
        paymentIntentId: 'pi_abc123',
        reason: 'other',
      });
      expect(result.success).toBe(false);
    });

    it('should reject non-positive refund amount', () => {
      const result = createRefundSchema.safeParse({
        paymentIntentId: 'pi_abc123',
        amount: 0,
      });
      expect(result.success).toBe(false);
    });
  });
});
