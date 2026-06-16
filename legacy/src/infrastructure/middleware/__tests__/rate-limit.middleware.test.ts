import { describe, it, expect } from 'vitest';

import {
  generalLimiter,
  authLimiter,
  adminAuthLimiter,
  stripeLimiter,
  forgotPasswordLimiter,
  emailLimiter,
} from '../rate-limit.middleware';

describe('rate-limit middleware exports', () => {
  it('should export generalLimiter as a function', () => {
    expect(generalLimiter).toBeDefined();
    expect(typeof generalLimiter).toBe('function');
  });

  it('should export authLimiter as a function', () => {
    expect(authLimiter).toBeDefined();
    expect(typeof authLimiter).toBe('function');
  });

  it('should export adminAuthLimiter as a function', () => {
    expect(adminAuthLimiter).toBeDefined();
    expect(typeof adminAuthLimiter).toBe('function');
  });

  it('should export stripeLimiter as a function', () => {
    expect(stripeLimiter).toBeDefined();
    expect(typeof stripeLimiter).toBe('function');
  });

  it('should export forgotPasswordLimiter as a function', () => {
    expect(forgotPasswordLimiter).toBeDefined();
    expect(typeof forgotPasswordLimiter).toBe('function');
  });

  it('should export emailLimiter as a function', () => {
    expect(emailLimiter).toBeDefined();
    expect(typeof emailLimiter).toBe('function');
  });
});
