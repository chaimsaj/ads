import { describe, it, expect, beforeEach, afterEach } from 'vitest';

import { getEnv, resetEnv } from '../environment';

describe('Environment Configuration', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    resetEnv();
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    resetEnv();
  });

  it('should load valid environment variables', () => {
    process.env.DATABASE_URL = 'mysql://test:test@localhost:3306/test';
    process.env.JWT_ACCESS_SECRET = 'a'.repeat(32);
    process.env.JWT_REFRESH_SECRET = 'b'.repeat(32);

    const env = getEnv();
    expect(env.NODE_ENV).toBe('test');
    expect(env.PORT).toBe(3001);
    expect(env.DATABASE_URL).toBe('mysql://test:test@localhost:3306/test');
  });

  it('should throw when DATABASE_URL is missing', () => {
    const saved = process.env.DATABASE_URL;
    delete process.env.DATABASE_URL;

    expect(() => getEnv()).toThrow('Environment validation failed');

    process.env.DATABASE_URL = saved;
  });

  it('should throw when JWT_ACCESS_SECRET is too short', () => {
    process.env.DATABASE_URL = 'mysql://test:test@localhost:3306/test';
    process.env.JWT_ACCESS_SECRET = 'short';
    process.env.JWT_REFRESH_SECRET = 'b'.repeat(32);

    expect(() => getEnv()).toThrow('Environment validation failed');
  });

  it('should apply defaults for optional values', () => {
    process.env.DATABASE_URL = 'mysql://test:test@localhost:3306/test';
    process.env.JWT_ACCESS_SECRET = 'a'.repeat(32);
    process.env.JWT_REFRESH_SECRET = 'b'.repeat(32);

    const env = getEnv();
    expect(env.JWT_ACCESS_EXPIRES_IN).toBe('15m');
    expect(env.JWT_REFRESH_EXPIRES_IN).toBe('7d');
    expect(env.CORS_ORIGINS).toBe('http://localhost:5173,http://localhost:5174');
    expect(env.SENDGRID_FROM_NAME).toBe('Myngly Ads');
    expect(env.COOKIE_SECURE).toBe(false);
  });

  it('should cache the environment on subsequent calls', () => {
    process.env.DATABASE_URL = 'mysql://test:test@localhost:3306/test';
    process.env.JWT_ACCESS_SECRET = 'a'.repeat(32);
    process.env.JWT_REFRESH_SECRET = 'b'.repeat(32);

    const env1 = getEnv();
    const env2 = getEnv();
    expect(env1).toBe(env2);
  });

  it('should parse COOKIE_SECURE as boolean', () => {
    process.env.DATABASE_URL = 'mysql://test:test@localhost:3306/test';
    process.env.JWT_ACCESS_SECRET = 'a'.repeat(32);
    process.env.JWT_REFRESH_SECRET = 'b'.repeat(32);
    process.env.COOKIE_SECURE = 'true';

    const env = getEnv();
    expect(env.COOKIE_SECURE).toBe(true);
  });
});
