import { describe, it, expect } from 'vitest';

import {
  registerSchema,
  loginSchema,
  verifyEmailSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
} from '../auth.validator';

describe('Auth Validators', () => {
  describe('registerSchema', () => {
    it('should accept valid registration data', () => {
      const result = registerSchema.safeParse({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'Str0ng!Pass',
      });
      expect(result.success).toBe(true);
    });

    it('should accept registration with optional fields', () => {
      const result = registerSchema.safeParse({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'Str0ng!Pass',
        phone: '+1234567890',
        company: 'Acme Inc',
      });
      expect(result.success).toBe(true);
    });

    it('should reject missing name', () => {
      const result = registerSchema.safeParse({
        email: 'john@example.com',
        password: 'Str0ng!Pass',
      });
      expect(result.success).toBe(false);
    });

    it('should reject invalid email', () => {
      const result = registerSchema.safeParse({
        name: 'John',
        email: 'not-an-email',
        password: 'Str0ng!Pass',
      });
      expect(result.success).toBe(false);
    });

    it('should reject weak password', () => {
      const result = registerSchema.safeParse({
        name: 'John',
        email: 'john@example.com',
        password: 'weak',
      });
      expect(result.success).toBe(false);
    });

    it('should reject password without special character', () => {
      const result = registerSchema.safeParse({
        name: 'John',
        email: 'john@example.com',
        password: 'NoSpecialChar1',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('loginSchema', () => {
    it('should accept valid login', () => {
      const result = loginSchema.safeParse({
        email: 'john@example.com',
        password: 'any-password',
      });
      expect(result.success).toBe(true);
    });

    it('should reject missing password', () => {
      const result = loginSchema.safeParse({
        email: 'john@example.com',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('verifyEmailSchema', () => {
    it('should accept valid verification data', () => {
      const result = verifyEmailSchema.safeParse({
        email: 'john@example.com',
        code: '123456',
      });
      expect(result.success).toBe(true);
    });

    it('should reject code with wrong length', () => {
      const result = verifyEmailSchema.safeParse({
        email: 'john@example.com',
        code: '123',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('forgotPasswordSchema', () => {
    it('should accept valid email', () => {
      const result = forgotPasswordSchema.safeParse({
        email: 'john@example.com',
      });
      expect(result.success).toBe(true);
    });

    it('should reject invalid email', () => {
      const result = forgotPasswordSchema.safeParse({
        email: 'not-email',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('resetPasswordSchema', () => {
    it('should accept valid reset data', () => {
      const result = resetPasswordSchema.safeParse({
        token: 'some-reset-token',
        password: 'NewStr0ng!Pass',
      });
      expect(result.success).toBe(true);
    });

    it('should reject weak new password', () => {
      const result = resetPasswordSchema.safeParse({
        token: 'some-token',
        password: 'weak',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('changePasswordSchema', () => {
    it('should accept valid change password data', () => {
      const result = changePasswordSchema.safeParse({
        currentPassword: 'anything',
        newPassword: 'NewStr0ng!Pass',
      });
      expect(result.success).toBe(true);
    });

    it('should reject weak new password', () => {
      const result = changePasswordSchema.safeParse({
        currentPassword: 'anything',
        newPassword: 'weak',
      });
      expect(result.success).toBe(false);
    });
  });
});
