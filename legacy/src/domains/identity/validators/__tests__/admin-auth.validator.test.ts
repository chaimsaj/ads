import { describe, it, expect } from 'vitest';

import {
  adminLoginSchema,
  adminChangePasswordSchema,
  twoFactorVerifySchema,
} from '../admin-auth.validator';

describe('Admin Auth Validators', () => {
  describe('adminLoginSchema', () => {
    it('should accept valid login without 2FA code', () => {
      const result = adminLoginSchema.safeParse({
        email: 'admin@example.com',
        password: 'admin-pass',
      });
      expect(result.success).toBe(true);
    });

    it('should accept valid login with 2FA code', () => {
      const result = adminLoginSchema.safeParse({
        email: 'admin@example.com',
        password: 'admin-pass',
        twoFactorCode: '123456',
      });
      expect(result.success).toBe(true);
    });

    it('should reject invalid email', () => {
      const result = adminLoginSchema.safeParse({
        email: 'not-email',
        password: 'pass',
      });
      expect(result.success).toBe(false);
    });

    it('should reject 2FA code with wrong length', () => {
      const result = adminLoginSchema.safeParse({
        email: 'admin@example.com',
        password: 'pass',
        twoFactorCode: '12',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('adminChangePasswordSchema', () => {
    it('should accept valid password change', () => {
      const result = adminChangePasswordSchema.safeParse({
        currentPassword: 'current',
        newPassword: 'NewStr0ng!Pass',
      });
      expect(result.success).toBe(true);
    });

    it('should reject weak new password', () => {
      const result = adminChangePasswordSchema.safeParse({
        currentPassword: 'current',
        newPassword: 'weak',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('twoFactorVerifySchema', () => {
    it('should accept valid 6-digit code', () => {
      const result = twoFactorVerifySchema.safeParse({ code: '123456' });
      expect(result.success).toBe(true);
    });

    it('should reject code with wrong length', () => {
      const result = twoFactorVerifySchema.safeParse({ code: '12' });
      expect(result.success).toBe(false);
    });

    it('should reject missing code', () => {
      const result = twoFactorVerifySchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });
});
