import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';

import { getTestApp } from '../helpers/test-server';
import {
  getCsrfToken,
  generateTestAccessToken,
  generateTestAdminToken,
} from '../helpers/e2e-helpers';
import { mockObjectId } from '../helpers/objectid-helper';

describe('Advertiser Journey E2E', () => {
  const app = getTestApp();
  let csrfToken: string;

  beforeEach(async () => {
    csrfToken = await getCsrfToken(app);
  });

  describe('Registration and Authentication', () => {
    it('should accept valid registration payload structure', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .set('Cookie', `csrf_token=${csrfToken}`)
        .set('X-Csrf-Token', csrfToken)
        .send({
          email: 'advertiser@example.com',
          password: 'SecurePass123!',
          name: 'Test Advertiser',
          role: 'ADVERTISER',
        });

      // Request should pass CSRF and validation (may fail at DB layer)
      expect(response.body.code).not.toBe('CSRF_INVALID');
      expect(response.body.code).not.toBe('VALIDATION_ERROR');
    });

    it('should reject registration with invalid email', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .set('Cookie', `csrf_token=${csrfToken}`)
        .set('X-Csrf-Token', csrfToken)
        .send({
          email: 'invalid-email',
          password: 'SecurePass123!',
          name: 'Test User',
        });

      // Zod validation returns 422
      expect(response.status).toBe(422);
      expect(response.body.success).toBe(false);
    });

    it('should reject registration without CSRF token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'advertiser@example.com',
          password: 'SecurePass123!',
          name: 'Test Advertiser',
        });

      expect(response.status).toBe(403);
      expect(response.body.code).toBe('CSRF_INVALID');
    });

    it('should accept valid login payload structure', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .set('Cookie', `csrf_token=${csrfToken}`)
        .set('X-Csrf-Token', csrfToken)
        .send({
          email: 'advertiser@example.com',
          password: 'password123',
        });

      // Request should pass CSRF and validation
      expect(response.body.code).not.toBe('CSRF_INVALID');
      expect(response.body.code).not.toBe('VALIDATION_ERROR');
    });

    it('should have rate limiting on login endpoint', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .set('Cookie', `csrf_token=${csrfToken}`)
        .set('X-Csrf-Token', csrfToken)
        .send({
          email: 'advertiser@example.com',
          password: 'password123',
        });

      expect(response.headers['ratelimit-limit']).toBeDefined();
    });
  });

  describe('Campaign Management', () => {
    it('should require authentication for campaign creation', async () => {
      const response = await request(app)
        .post('/api/v1/campaigns')
        .set('Cookie', `csrf_token=${csrfToken}`)
        .set('X-Csrf-Token', csrfToken)
        .send({
          name: 'Test Campaign',
          adType: 'USER',
          adFormat: 'BANNER',
          startDate: '2026-02-01',
          endDate: '2026-02-28',
          budget: 1000,
        });

      expect(response.status).toBe(401);
    });

    it('should accept valid campaign creation payload when authenticated', async () => {
      const accessToken = generateTestAccessToken({ sub: mockObjectId(1), role: 'ADVERTISER' });

      const response = await request(app)
        .post('/api/v1/campaigns')
        .set('Cookie', [`access_token=${accessToken}`, `csrf_token=${csrfToken}`])
        .set('X-Csrf-Token', csrfToken)
        .send({
          name: 'Test Campaign',
          adType: 'USER',
          adFormat: 'BANNER',
          startDate: '2026-02-01',
          endDate: '2026-02-28',
          budget: 1000,
        });

      // Should pass CSRF, auth, and validation (may fail at DB layer)
      expect(response.body.code).not.toBe('CSRF_INVALID');
      expect(response.body.code).not.toBe('VALIDATION_ERROR');
      expect(response.status).not.toBe(401);
    });

    it('should validate campaign creation payload', async () => {
      const accessToken = generateTestAccessToken({ sub: mockObjectId(1), role: 'ADVERTISER' });

      const response = await request(app)
        .post('/api/v1/campaigns')
        .set('Cookie', [`access_token=${accessToken}`, `csrf_token=${csrfToken}`])
        .set('X-Csrf-Token', csrfToken)
        .send({
          name: '', // Invalid: empty name
          adType: 'INVALID_TYPE',
          adFormat: 'BANNER',
          startDate: '2026-02-01',
          endDate: '2026-02-28',
          budget: -100, // Invalid: negative budget
        });

      expect(response.status).toBe(422);
    });

    it('should require authentication for campaign list', async () => {
      const response = await request(app)
        .get('/api/v1/campaigns')
        .set('Cookie', `csrf_token=${csrfToken}`);

      expect(response.status).toBe(401);
    });

    it('should accept authenticated request for campaign list', async () => {
      const accessToken = generateTestAccessToken({ sub: mockObjectId(1), role: 'ADVERTISER' });

      const response = await request(app)
        .get('/api/v1/campaigns')
        .set('Cookie', [`access_token=${accessToken}`, `csrf_token=${csrfToken}`]);

      // Should pass auth (may fail at DB layer)
      expect(response.status).not.toBe(401);
    });

    it('should require authentication for campaign status update', async () => {
      const response = await request(app)
        .patch(`/api/v1/campaigns/${mockObjectId(1)}/status`)
        .set('Cookie', `csrf_token=${csrfToken}`)
        .set('X-Csrf-Token', csrfToken)
        .send({ status: 'REVIEW' });

      expect(response.status).toBe(401);
    });
  });

  describe('Admin Campaign Approval', () => {
    it('should require admin authentication for campaign approval', async () => {
      const response = await request(app)
        .post(`/admin/v1/campaigns/${mockObjectId(1)}/approve`)
        .set('Cookie', `csrf_token=${csrfToken}`)
        .set('X-Csrf-Token', csrfToken);

      expect(response.status).toBe(401);
    });

    it('should reject user token on admin endpoints', async () => {
      const userToken = generateTestAccessToken({ sub: mockObjectId(1), role: 'ADVERTISER' });

      const response = await request(app)
        .post(`/admin/v1/campaigns/${mockObjectId(1)}/approve`)
        .set('Cookie', [`access_token=${userToken}`, `csrf_token=${csrfToken}`])
        .set('X-Csrf-Token', csrfToken);

      // User token should not work on admin endpoints
      expect(response.status).toBe(401);
    });

    it('should accept admin token for campaign approval endpoint', async () => {
      const adminToken = generateTestAdminToken({ sub: mockObjectId(1), role: 'ADMIN' });

      const response = await request(app)
        .post(`/admin/v1/campaigns/${mockObjectId(1)}/approve`)
        .set('Cookie', [`admin_access_token=${adminToken}`, `csrf_token=${csrfToken}`])
        .set('X-Csrf-Token', csrfToken);

      // Should pass auth (may fail at DB layer for non-existent campaign)
      expect(response.status).not.toBe(401);
      expect(response.body.code).not.toBe('CSRF_INVALID');
    });

    it('should validate campaign rejection requires reason', async () => {
      const adminToken = generateTestAdminToken({ sub: mockObjectId(1), role: 'ADMIN' });

      const response = await request(app)
        .post(`/admin/v1/campaigns/${mockObjectId(1)}/reject`)
        .set('Cookie', [`admin_access_token=${adminToken}`, `csrf_token=${csrfToken}`])
        .set('X-Csrf-Token', csrfToken)
        .send({}); // Missing required reason

      expect(response.status).toBe(422);
    });
  });
});
