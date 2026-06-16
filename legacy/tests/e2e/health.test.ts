import { describe, it, expect } from 'vitest';
import request from 'supertest';

import { getTestApp } from '../helpers/test-server';

describe('Health Check', () => {
  const app = getTestApp();

  it('should return 200 with status ok', async () => {
    const response = await request(app).get('/health');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.status).toBe('ok');
    expect(response.body.data.timestamp).toBeDefined();
    expect(response.body.data.version).toBeDefined();
  });
});

describe('404 Handler', () => {
  const app = getTestApp();

  it('should return 404 for unknown routes', async () => {
    const response = await request(app).get('/nonexistent');

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
    expect(response.body.code).toBe('ROUTE_NOT_FOUND');
  });

  it('should include request ID in error response', async () => {
    const response = await request(app)
      .get('/nonexistent')
      .set('X-Request-Id', 'test-req-123');

    expect(response.status).toBe(404);
    expect(response.body.requestId).toBe('test-req-123');
  });
});

describe('Request ID Middleware', () => {
  const app = getTestApp();

  it('should return X-Request-Id header', async () => {
    const response = await request(app).get('/health');

    expect(response.headers['x-request-id']).toBeDefined();
  });

  it('should use provided X-Request-Id header', async () => {
    const response = await request(app)
      .get('/health')
      .set('X-Request-Id', 'custom-id-456');

    expect(response.headers['x-request-id']).toBe('custom-id-456');
  });
});

describe('Security Headers', () => {
  const app = getTestApp();

  it('should include security headers from Helmet', async () => {
    const response = await request(app).get('/health');

    expect(response.headers['x-content-type-options']).toBe('nosniff');
    expect(response.headers['x-frame-options']).toBeDefined();
  });
});
