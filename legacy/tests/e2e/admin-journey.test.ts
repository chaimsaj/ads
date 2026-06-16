import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';

import { getTestApp } from '../helpers/test-server';
import {
  getCsrfToken,
  generateTestAccessToken,
  generateTestAdminToken,
} from '../helpers/e2e-helpers';
import { mockObjectId } from '../helpers/objectid-helper';

describe('Admin Journey E2E', () => {
  const app = getTestApp();
  let csrfToken: string;

  beforeEach(async () => {
    csrfToken = await getCsrfToken(app);
  });

  describe('Admin Authentication', () => {
    it('should accept valid admin login payload', async () => {
      const response = await request(app)
        .post('/admin/v1/auth/login')
        .set('Cookie', `csrf_token=${csrfToken}`)
        .set('X-Csrf-Token', csrfToken)
        .send({
          email: 'admin@example.com',
          password: 'AdminPass123!',
        });

      // Request should pass CSRF and validation
      expect(response.body.code).not.toBe('CSRF_INVALID');
      expect(response.body.code).not.toBe('VALIDATION_ERROR');
    });

    it('should have rate limiting on admin login endpoint', async () => {
      const response = await request(app)
        .post('/admin/v1/auth/login')
        .set('Cookie', `csrf_token=${csrfToken}`)
        .set('X-Csrf-Token', csrfToken)
        .send({
          email: 'admin@example.com',
          password: 'AdminPass123!',
        });

      expect(response.headers['ratelimit-limit']).toBeDefined();
    });

    it('should reject login with invalid email format', async () => {
      const response = await request(app)
        .post('/admin/v1/auth/login')
        .set('Cookie', `csrf_token=${csrfToken}`)
        .set('X-Csrf-Token', csrfToken)
        .send({
          email: 'invalid-email',
          password: 'AdminPass123!',
        });

      expect(response.status).toBe(422);
    });

    it('should require admin auth for profile endpoint', async () => {
      const response = await request(app)
        .get('/admin/v1/auth/profile')
        .set('Cookie', `csrf_token=${csrfToken}`);

      expect(response.status).toBe(401);
    });

    it('should accept valid admin token for profile endpoint', async () => {
      const adminToken = generateTestAdminToken({ sub: mockObjectId(1), role: 'ADMIN' });

      const response = await request(app)
        .get('/admin/v1/auth/profile')
        .set('Cookie', [`admin_access_token=${adminToken}`, `csrf_token=${csrfToken}`]);

      // Should pass auth (may fail at DB layer)
      expect(response.status).not.toBe(401);
    });
  });

  describe('User Management', () => {
    it('should require admin auth to list users', async () => {
      const response = await request(app)
        .get('/admin/v1/users')
        .set('Cookie', `csrf_token=${csrfToken}`);

      expect(response.status).toBe(401);
    });

    it('should reject user token on admin user list', async () => {
      const userToken = generateTestAccessToken({ sub: mockObjectId(1), role: 'ADVERTISER' });

      const response = await request(app)
        .get('/admin/v1/users')
        .set('Cookie', [`access_token=${userToken}`, `csrf_token=${csrfToken}`]);

      expect(response.status).toBe(401);
    });

    it('should accept admin token for user list', async () => {
      const adminToken = generateTestAdminToken({ sub: mockObjectId(1), role: 'ADMIN' });

      const response = await request(app)
        .get('/admin/v1/users')
        .set('Cookie', [`admin_access_token=${adminToken}`, `csrf_token=${csrfToken}`]);

      // Should pass auth
      expect(response.status).not.toBe(401);
    });

    it('should require admin auth to get single user', async () => {
      const response = await request(app)
        .get(`/admin/v1/users/${mockObjectId(1)}`)
        .set('Cookie', `csrf_token=${csrfToken}`);

      expect(response.status).toBe(401);
    });

    it('should accept admin token for single user', async () => {
      const adminToken = generateTestAdminToken({ sub: mockObjectId(1), role: 'ADMIN' });

      const response = await request(app)
        .get(`/admin/v1/users/${mockObjectId(1)}`)
        .set('Cookie', [`admin_access_token=${adminToken}`, `csrf_token=${csrfToken}`]);

      // Should pass auth (may fail at DB layer)
      expect(response.status).not.toBe(401);
    });

    it('should require admin auth to suspend user', async () => {
      const response = await request(app)
        .post(`/admin/v1/users/${mockObjectId(1)}/suspend`)
        .set('Cookie', `csrf_token=${csrfToken}`)
        .set('X-Csrf-Token', csrfToken);

      expect(response.status).toBe(401);
    });

    it('should accept admin token for user suspension', async () => {
      const adminToken = generateTestAdminToken({ sub: mockObjectId(1), role: 'ADMIN' });

      const response = await request(app)
        .post(`/admin/v1/users/${mockObjectId(1)}/suspend`)
        .set('Cookie', [`admin_access_token=${adminToken}`, `csrf_token=${csrfToken}`])
        .set('X-Csrf-Token', csrfToken);

      // Should pass CSRF and auth
      expect(response.body.code).not.toBe('CSRF_INVALID');
      expect(response.status).not.toBe(401);
    });

    it('should require admin auth for user status counts', async () => {
      const response = await request(app)
        .get('/admin/v1/users/status-counts')
        .set('Cookie', `csrf_token=${csrfToken}`);

      expect(response.status).toBe(401);
    });
  });

  describe('Campaign Administration', () => {
    it('should require admin auth to list all campaigns', async () => {
      const response = await request(app)
        .get('/admin/v1/campaigns')
        .set('Cookie', `csrf_token=${csrfToken}`);

      expect(response.status).toBe(401);
    });

    it('should accept admin token for campaign list', async () => {
      const adminToken = generateTestAdminToken({ sub: mockObjectId(1), role: 'ADMIN' });

      const response = await request(app)
        .get('/admin/v1/campaigns')
        .set('Cookie', [`admin_access_token=${adminToken}`, `csrf_token=${csrfToken}`]);

      expect(response.status).not.toBe(401);
    });

    it('should require admin auth for campaign approval', async () => {
      const response = await request(app)
        .post(`/admin/v1/campaigns/${mockObjectId(1)}/approve`)
        .set('Cookie', `csrf_token=${csrfToken}`)
        .set('X-Csrf-Token', csrfToken);

      expect(response.status).toBe(401);
    });

    it('should accept admin token for campaign approval', async () => {
      const adminToken = generateTestAdminToken({ sub: mockObjectId(1), role: 'ADMIN' });

      const response = await request(app)
        .post(`/admin/v1/campaigns/${mockObjectId(1)}/approve`)
        .set('Cookie', [`admin_access_token=${adminToken}`, `csrf_token=${csrfToken}`])
        .set('X-Csrf-Token', csrfToken);

      // Should pass CSRF and auth
      expect(response.body.code).not.toBe('CSRF_INVALID');
      expect(response.status).not.toBe(401);
    });

    it('should require admin auth for campaign CSV export', async () => {
      const response = await request(app)
        .get('/admin/v1/campaigns/export')
        .set('Cookie', `csrf_token=${csrfToken}`);

      expect(response.status).toBe(401);
    });

    it('should accept admin token for campaign CSV export', async () => {
      const adminToken = generateTestAdminToken({ sub: mockObjectId(1), role: 'ADMIN' });

      const response = await request(app)
        .get('/admin/v1/campaigns/export')
        .set('Cookie', [`admin_access_token=${adminToken}`, `csrf_token=${csrfToken}`]);

      expect(response.status).not.toBe(401);
    });

    it('should require admin auth for campaign status counts', async () => {
      const response = await request(app)
        .get('/admin/v1/campaigns/status-counts')
        .set('Cookie', `csrf_token=${csrfToken}`);

      expect(response.status).toBe(401);
    });
  });

  describe('Audit Logs', () => {
    it('should require admin auth to access audit logs', async () => {
      const response = await request(app)
        .get('/admin/v1/audit-logs')
        .set('Cookie', `csrf_token=${csrfToken}`);

      expect(response.status).toBe(401);
    });

    it('should accept admin token for audit logs', async () => {
      const adminToken = generateTestAdminToken({ sub: mockObjectId(1), role: 'ADMIN' });

      const response = await request(app)
        .get('/admin/v1/audit-logs')
        .set('Cookie', [`admin_access_token=${adminToken}`, `csrf_token=${csrfToken}`]);

      expect(response.status).not.toBe(401);
    });
  });

  describe('Dashboard Analytics', () => {
    it('should require admin auth for dashboard stats', async () => {
      const response = await request(app)
        .get('/admin/v1/dashboard/stats')
        .set('Cookie', `csrf_token=${csrfToken}`);

      expect(response.status).toBe(401);
    });

    it('should accept admin token for dashboard stats', async () => {
      const adminToken = generateTestAdminToken({ sub: mockObjectId(1), role: 'ADMIN' });

      const response = await request(app)
        .get('/admin/v1/dashboard/stats')
        .set('Cookie', [`admin_access_token=${adminToken}`, `csrf_token=${csrfToken}`]);

      expect(response.status).not.toBe(401);
    });
  });
});
