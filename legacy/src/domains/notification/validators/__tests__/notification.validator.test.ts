import { describe, it, expect } from 'vitest';

import { sendEmailSchema, bulkEmailSchema, emailQuerySchema } from '../notification.validator';

describe('Notification Validators', () => {
  describe('sendEmailSchema', () => {
    it('should accept valid email data', () => {
      const result = sendEmailSchema.parse({
        to: 'user@example.com',
        subject: 'Test Subject',
        html: '<p>Hello</p>',
      });
      expect(result.to).toBe('user@example.com');
    });

    it('should reject invalid email', () => {
      expect(() => sendEmailSchema.parse({ to: 'invalid', subject: 'Test' })).toThrow();
    });

    it('should reject empty subject', () => {
      expect(() => sendEmailSchema.parse({ to: 'user@example.com', subject: '' })).toThrow();
    });
  });

  describe('bulkEmailSchema', () => {
    it('should accept valid bulk email data', () => {
      const result = bulkEmailSchema.parse({
        to: ['a@example.com', 'b@example.com'],
        subject: 'Bulk Test',
      });
      expect(result.to).toHaveLength(2);
    });

    it('should reject empty recipients', () => {
      expect(() => bulkEmailSchema.parse({ to: [], subject: 'Test' })).toThrow();
    });

    it('should reject invalid email in array', () => {
      expect(() => bulkEmailSchema.parse({ to: ['valid@example.com', 'invalid'], subject: 'Test' })).toThrow();
    });
  });

  describe('emailQuerySchema', () => {
    it('should use defaults', () => {
      const result = emailQuerySchema.parse({});
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
    });
  });
});
