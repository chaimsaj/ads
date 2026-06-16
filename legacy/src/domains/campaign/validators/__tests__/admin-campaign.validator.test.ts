import { describe, it, expect } from 'vitest';

import { mockObjectId } from '../../../../../tests/helpers/objectid-helper';
import {
  rejectCampaignSchema,
  adminUpdateStatusSchema,
  bulkStatusSchema,
  bulkDeleteSchema,
  adminCampaignQuerySchema,
  adminIdParamSchema,
} from '../admin-campaign.validator';

describe('admin-campaign.validator', () => {
  describe('rejectCampaignSchema', () => {
    it('should accept valid rejection reason', () => {
      const result = rejectCampaignSchema.safeParse({ reason: 'Policy violation' });
      expect(result.success).toBe(true);
    });

    it('should reject empty reason', () => {
      const result = rejectCampaignSchema.safeParse({ reason: '' });
      expect(result.success).toBe(false);
    });

    it('should reject missing reason', () => {
      const result = rejectCampaignSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe('adminUpdateStatusSchema', () => {
    it('should accept ACTIVE status', () => {
      const result = adminUpdateStatusSchema.safeParse({ status: 'ACTIVE' });
      expect(result.success).toBe(true);
    });

    it('should accept PAUSED status', () => {
      const result = adminUpdateStatusSchema.safeParse({ status: 'PAUSED' });
      expect(result.success).toBe(true);
    });

    it('should reject DRAFT status (user-only)', () => {
      const result = adminUpdateStatusSchema.safeParse({ status: 'DRAFT' });
      expect(result.success).toBe(false);
    });

    it('should reject REVIEW status', () => {
      const result = adminUpdateStatusSchema.safeParse({ status: 'REVIEW' });
      expect(result.success).toBe(false);
    });
  });

  describe('bulkStatusSchema', () => {
    it('should accept valid bulk status update', () => {
      const result = bulkStatusSchema.safeParse({ ids: [mockObjectId(1), mockObjectId(2), mockObjectId(3)], status: 'PAUSED' });
      expect(result.success).toBe(true);
    });

    it('should reject empty IDs array', () => {
      const result = bulkStatusSchema.safeParse({ ids: [], status: 'PAUSED' });
      expect(result.success).toBe(false);
    });

    it('should reject more than 100 IDs', () => {
      const ids = Array.from({ length: 101 }, (_, i) => mockObjectId(i + 1));
      const result = bulkStatusSchema.safeParse({ ids, status: 'PAUSED' });
      expect(result.success).toBe(false);
    });

    it('should reject invalid ObjectId format', () => {
      const result = bulkStatusSchema.safeParse({ ids: ['invalid', 'ids'], status: 'PAUSED' });
      expect(result.success).toBe(false);
    });
  });

  describe('bulkDeleteSchema', () => {
    it('should accept valid IDs', () => {
      const result = bulkDeleteSchema.safeParse({ ids: [mockObjectId(1), mockObjectId(2)] });
      expect(result.success).toBe(true);
    });

    it('should reject empty array', () => {
      const result = bulkDeleteSchema.safeParse({ ids: [] });
      expect(result.success).toBe(false);
    });
  });

  describe('adminCampaignQuerySchema', () => {
    it('should apply defaults', () => {
      const result = adminCampaignQuerySchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(1);
        expect(result.data.limit).toBe(20);
      }
    });

    it('should accept userId filter', () => {
      const result = adminCampaignQuerySchema.safeParse({ userId: mockObjectId(5) });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.userId).toBe(mockObjectId(5));
      }
    });

    it('should accept all filter combinations', () => {
      const result = adminCampaignQuerySchema.safeParse({
        page: '1',
        limit: '50',
        sortBy: 'name',
        sortOrder: 'asc',
        search: 'test',
        status: 'REVIEW',
        adFormat: 'PUSH',
        adType: 'EVENT',
        userId: mockObjectId(10),
        dateFrom: '2025-01-01',
        dateTo: '2025-12-31',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('adminIdParamSchema', () => {
    it('should accept valid ObjectId string', () => {
      const result = adminIdParamSchema.safeParse({ id: mockObjectId(42) });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe(mockObjectId(42));
      }
    });

    it('should reject invalid ID', () => {
      const result = adminIdParamSchema.safeParse({ id: 'abc' });
      expect(result.success).toBe(false);
    });
  });
});
