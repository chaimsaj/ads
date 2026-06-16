import { describe, it, expect } from 'vitest';

import { mockObjectId } from '../../../../../tests/helpers/objectid-helper';
import {
  adminUserIdParamSchema,
  adminUserQuerySchema,
  adminUpdateUserSchema,
  adminUpdateUserStatusSchema,
  bulkUserActionSchema,
} from '../admin-user.validator';

describe('admin-user.validator', () => {
  describe('adminUserIdParamSchema', () => {
    it('should accept valid ObjectId string', () => {
      const result = adminUserIdParamSchema.safeParse({ id: mockObjectId(42) });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe(mockObjectId(42));
      }
    });

    it('should reject short string', () => {
      const result = adminUserIdParamSchema.safeParse({ id: '0' });
      expect(result.success).toBe(false);
    });

    it('should reject non-hex string', () => {
      const result = adminUserIdParamSchema.safeParse({ id: 'zzzzzzzzzzzzzzzzzzzzzzzz' });
      expect(result.success).toBe(false);
    });

    it('should reject non-numeric string', () => {
      const result = adminUserIdParamSchema.safeParse({ id: 'abc' });
      expect(result.success).toBe(false);
    });
  });

  describe('adminUserQuerySchema', () => {
    it('should apply defaults for empty query', () => {
      const result = adminUserQuerySchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(1);
        expect(result.data.limit).toBe(20);
        expect(result.data.sortBy).toBe('createdAt');
        expect(result.data.sortOrder).toBe('desc');
      }
    });

    it('should coerce string numbers from query params', () => {
      const result = adminUserQuerySchema.safeParse({ page: '3', limit: '50' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(3);
        expect(result.data.limit).toBe(50);
      }
    });

    it('should accept all filter fields', () => {
      const result = adminUserQuerySchema.safeParse({
        page: '1',
        limit: '25',
        search: 'john',
        status: 'ACTIVE',
        role: 'USER',
        sortBy: 'name',
        sortOrder: 'asc',
        dateFrom: '2025-01-01',
        dateTo: '2025-12-31',
      });
      expect(result.success).toBe(true);
    });

    it('should coerce date strings to Date objects', () => {
      const result = adminUserQuerySchema.safeParse({
        dateFrom: '2025-06-01',
        dateTo: '2025-06-30',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.dateFrom).toBeInstanceOf(Date);
        expect(result.data.dateTo).toBeInstanceOf(Date);
      }
    });

    it('should reject limit over 100', () => {
      const result = adminUserQuerySchema.safeParse({ limit: '200' });
      expect(result.success).toBe(false);
    });

    it('should reject invalid status enum', () => {
      const result = adminUserQuerySchema.safeParse({ status: 'DELETED' });
      expect(result.success).toBe(false);
    });
  });

  describe('adminUpdateUserSchema', () => {
    it('should accept valid partial update', () => {
      const result = adminUpdateUserSchema.safeParse({
        name: 'Updated Name',
        email: 'updated@example.com',
      });
      expect(result.success).toBe(true);
    });

    it('should accept empty object', () => {
      const result = adminUpdateUserSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it('should accept null for nullable fields', () => {
      const result = adminUpdateUserSchema.safeParse({
        phone: null,
        company: null,
      });
      expect(result.success).toBe(true);
    });

    it('should reject invalid email format', () => {
      const result = adminUpdateUserSchema.safeParse({ email: 'not-an-email' });
      expect(result.success).toBe(false);
    });
  });

  describe('adminUpdateUserStatusSchema', () => {
    it('should accept ACTIVE status', () => {
      const result = adminUpdateUserStatusSchema.safeParse({ status: 'ACTIVE' });
      expect(result.success).toBe(true);
    });

    it('should accept SUSPENDED status', () => {
      const result = adminUpdateUserStatusSchema.safeParse({ status: 'SUSPENDED' });
      expect(result.success).toBe(true);
    });

    it('should reject invalid status value', () => {
      const result = adminUpdateUserStatusSchema.safeParse({ status: 'DELETED' });
      expect(result.success).toBe(false);
    });

    it('should reject missing status', () => {
      const result = adminUpdateUserStatusSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe('bulkUserActionSchema', () => {
    it('should accept valid bulk action', () => {
      const result = bulkUserActionSchema.safeParse({
        ids: [mockObjectId(1), mockObjectId(2), mockObjectId(3)],
        action: 'activate',
      });
      expect(result.success).toBe(true);
    });

    it('should reject empty IDs array', () => {
      const result = bulkUserActionSchema.safeParse({ ids: [], action: 'suspend' });
      expect(result.success).toBe(false);
    });

    it('should reject more than 100 IDs', () => {
      const ids = Array.from({ length: 101 }, (_, i) => mockObjectId(i + 1));
      const result = bulkUserActionSchema.safeParse({ ids, action: 'delete' });
      expect(result.success).toBe(false);
    });

    it('should reject invalid ObjectId format', () => {
      const result = bulkUserActionSchema.safeParse({ ids: ['invalid'], action: 'activate' });
      expect(result.success).toBe(false);
    });

    it('should reject invalid action', () => {
      const result = bulkUserActionSchema.safeParse({ ids: [mockObjectId(1)], action: 'ban' });
      expect(result.success).toBe(false);
    });
  });
});
