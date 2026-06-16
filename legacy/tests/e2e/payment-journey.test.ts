import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';

import { getTestApp } from '../helpers/test-server';
import { getCsrfToken, generateTestAccessToken } from '../helpers/e2e-helpers';
import { mockObjectId } from '../helpers/objectid-helper';

describe('Payment Journey E2E', () => {
  const app = getTestApp();
  let csrfToken: string;

  beforeEach(async () => {
    csrfToken = await getCsrfToken(app);
  });

  describe('Payment Methods', () => {
    it('should require authentication to list payment methods', async () => {
      const response = await request(app)
        .get('/api/v1/user/payment-methods')
        .set('Cookie', `csrf_token=${csrfToken}`);

      expect(response.status).toBe(401);
    });

    it('should accept authenticated request for listing payment methods', async () => {
      const accessToken = generateTestAccessToken({ sub: mockObjectId(1), role: 'ADVERTISER' });

      const response = await request(app)
        .get('/api/v1/user/payment-methods')
        .set('Cookie', [`access_token=${accessToken}`, `csrf_token=${csrfToken}`]);

      // Should pass auth (may fail at DB layer)
      expect(response.status).not.toBe(401);
    });

    it('should require authentication to add payment method', async () => {
      const response = await request(app)
        .post('/api/v1/user/payment-methods')
        .set('Cookie', `csrf_token=${csrfToken}`)
        .set('X-Csrf-Token', csrfToken)
        .send({
          stripePaymentMethodId: 'pm_test_123',
          setAsDefault: true,
        });

      expect(response.status).toBe(401);
    });

    it('should accept valid payment method payload when authenticated', async () => {
      const accessToken = generateTestAccessToken({ sub: mockObjectId(1), role: 'ADVERTISER' });

      const response = await request(app)
        .post('/api/v1/user/payment-methods')
        .set('Cookie', [`access_token=${accessToken}`, `csrf_token=${csrfToken}`])
        .set('X-Csrf-Token', csrfToken)
        .send({
          stripePaymentMethodId: 'pm_test_123',
          cardholderName: 'Test User',
          cardType: 'visa',
          lastFour: '4242',
          expiryMonth: 12,
          expiryYear: 2027,
          setAsDefault: true,
        });

      // Should pass CSRF, auth, and validation
      expect(response.body.code).not.toBe('CSRF_INVALID');
      expect(response.body.code).not.toBe('VALIDATION_ERROR');
      expect(response.status).not.toBe(401);
    });

    it('should validate payment method payload', async () => {
      const accessToken = generateTestAccessToken({ sub: mockObjectId(1), role: 'ADVERTISER' });

      const response = await request(app)
        .post('/api/v1/user/payment-methods')
        .set('Cookie', [`access_token=${accessToken}`, `csrf_token=${csrfToken}`])
        .set('X-Csrf-Token', csrfToken)
        .send({
          // Missing required stripePaymentMethodId
          setAsDefault: true,
        });

      expect(response.status).toBe(422);
    });

    it('should require authentication to remove payment method', async () => {
      const response = await request(app)
        .delete('/api/v1/user/payment-methods/pm_test_123')
        .set('Cookie', `csrf_token=${csrfToken}`)
        .set('X-Csrf-Token', csrfToken);

      expect(response.status).toBe(401);
    });

    it('should require authentication to set default payment method', async () => {
      const response = await request(app)
        .patch('/api/v1/user/payment-methods/pm_test_123/default')
        .set('Cookie', `csrf_token=${csrfToken}`)
        .set('X-Csrf-Token', csrfToken);

      expect(response.status).toBe(401);
    });
  });

  describe('Stripe Customer', () => {
    it('should require authentication to create Stripe customer', async () => {
      const response = await request(app)
        .post('/api/v1/stripe/customers')
        .set('Cookie', `csrf_token=${csrfToken}`)
        .set('X-Csrf-Token', csrfToken)
        .send({
          email: 'customer@example.com',
          name: 'Test Customer',
        });

      expect(response.status).toBe(401);
    });

    it('should accept authenticated request for Stripe customer creation', async () => {
      const accessToken = generateTestAccessToken({ sub: mockObjectId(1), role: 'ADVERTISER' });

      const response = await request(app)
        .post('/api/v1/stripe/customers')
        .set('Cookie', [`access_token=${accessToken}`, `csrf_token=${csrfToken}`])
        .set('X-Csrf-Token', csrfToken)
        .send({
          email: 'customer@example.com',
          name: 'Test Customer',
        });

      // Should pass CSRF and auth (may fail if Stripe not configured)
      expect(response.body.code).not.toBe('CSRF_INVALID');
      expect(response.status).not.toBe(401);
    });
  });

  describe('Stripe Webhook', () => {
    it('should bypass CSRF for webhook endpoint', async () => {
      const response = await request(app)
        .post('/api/v1/stripe/webhooks')
        .set('Content-Type', 'application/json')
        .send({
          id: 'evt_test_123',
          type: 'payment_intent.succeeded',
          data: {
            object: {
              id: 'pi_test_123',
              amount: 1000,
            },
          },
        });

      // Should NOT fail with CSRF_INVALID (will fail for other reasons like missing Stripe signature)
      expect(response.body.code).not.toBe('CSRF_INVALID');
    });

    it('should process webhook without authentication', async () => {
      const response = await request(app)
        .post('/api/v1/stripe/webhooks')
        .set('Content-Type', 'application/json')
        .send({
          id: 'evt_test_456',
          type: 'customer.subscription.created',
          data: {
            object: {
              id: 'sub_test_123',
            },
          },
        });

      // Should not require authentication (401)
      expect(response.status).not.toBe(401);
    });
  });

  describe('Stripe Invoices', () => {
    it('should require authentication to list invoices', async () => {
      const response = await request(app)
        .get('/api/v1/stripe/invoices')
        .set('Cookie', `csrf_token=${csrfToken}`);

      expect(response.status).toBe(401);
    });

    it('should accept authenticated request for invoice list', async () => {
      const accessToken = generateTestAccessToken({ sub: mockObjectId(1), role: 'ADVERTISER' });

      const response = await request(app)
        .get('/api/v1/stripe/invoices')
        .set('Cookie', [`access_token=${accessToken}`, `csrf_token=${csrfToken}`]);

      // Should pass auth (may fail if Stripe not configured)
      expect(response.status).not.toBe(401);
    });
  });
});
