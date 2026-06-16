import { describe, it, expect } from 'vitest';
import request from 'supertest';

import { getTestApp } from '../helpers/test-server';
import { getCsrfToken } from '../helpers/e2e-helpers';

describe('Security E2E', () => {
  const app = getTestApp();

  describe('CSRF Protection', () => {
    it('should set csrf_token cookie on GET /health', async () => {
      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      const cookies = response.headers['set-cookie'] as string[];
      const csrfCookie = cookies?.find((c) => c.startsWith('csrf_token='));
      expect(csrfCookie).toBeDefined();
      expect(csrfCookie).toContain('SameSite=Strict');
    });

    it('should return 403 CSRF_INVALID for POST without CSRF token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'test@example.com', password: 'password123' });

      expect(response.status).toBe(403);
      expect(response.body.code).toBe('CSRF_INVALID');
    });

    it('should return 403 CSRF_INVALID for POST with mismatched tokens', async () => {
      const csrfToken = await getCsrfToken(app);

      const response = await request(app)
        .post('/api/v1/auth/login')
        .set('Cookie', `csrf_token=${csrfToken}`)
        .set('X-Csrf-Token', 'wrong-token')
        .send({ email: 'test@example.com', password: 'password123' });

      expect(response.status).toBe(403);
      expect(response.body.code).toBe('CSRF_INVALID');
    });

    it('should pass CSRF validation with matching tokens (auth may fail)', async () => {
      const csrfToken = await getCsrfToken(app);

      const response = await request(app)
        .post('/api/v1/auth/login')
        .set('Cookie', `csrf_token=${csrfToken}`)
        .set('X-Csrf-Token', csrfToken)
        .send({ email: 'test@example.com', password: 'password123' });

      // Should not be 403 CSRF_INVALID - auth will fail differently
      expect(response.body.code).not.toBe('CSRF_INVALID');
    });

    it('should bypass CSRF for webhook routes', async () => {
      // Stripe webhook route should not require CSRF
      const response = await request(app)
        .post('/api/v1/stripe/webhooks')
        .set('Content-Type', 'application/json')
        .send({ type: 'test.event' });

      // Should not be 403 CSRF_INVALID (will fail for other reasons like missing signature)
      expect(response.body.code).not.toBe('CSRF_INVALID');
    });
  });

  describe('Helmet Security Headers', () => {
    it('should include X-Content-Type-Options header', async () => {
      const response = await request(app).get('/health');

      expect(response.headers['x-content-type-options']).toBe('nosniff');
    });

    it('should include X-Frame-Options header', async () => {
      const response = await request(app).get('/health');

      expect(response.headers['x-frame-options']).toBeDefined();
    });

    it('should include X-XSS-Protection or Content-Security-Policy', async () => {
      const response = await request(app).get('/health');

      const hasXss = response.headers['x-xss-protection'] !== undefined;
      const hasCsp = response.headers['content-security-policy'] !== undefined;

      expect(hasXss || hasCsp).toBe(true);
    });

    it('should include Strict-Transport-Security in production-like mode', async () => {
      const response = await request(app).get('/health');

      // Helmet sets this header
      expect(response.headers['strict-transport-security']).toBeDefined();
    });
  });

  describe('Rate Limiting', () => {
    it('should include rate limit headers on API responses', async () => {
      const csrfToken = await getCsrfToken(app);

      const response = await request(app)
        .post('/api/v1/auth/login')
        .set('Cookie', `csrf_token=${csrfToken}`)
        .set('X-Csrf-Token', csrfToken)
        .send({ email: 'test@example.com', password: 'password123' });

      // Rate limit headers from express-rate-limit with standardHeaders: true
      expect(response.headers['ratelimit-limit']).toBeDefined();
      expect(response.headers['ratelimit-remaining']).toBeDefined();
    });
  });
});
