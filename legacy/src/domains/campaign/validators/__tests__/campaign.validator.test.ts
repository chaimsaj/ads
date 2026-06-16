import { describe, it, expect } from 'vitest';

import {
  createCampaignSchema,
  updateCampaignSchema,
  updateStatusSchema,
  campaignQuerySchema,
  idParamSchema,
} from '../campaign.validator';

describe('campaign.validator', () => {
  describe('createCampaignSchema', () => {
    const validData = {
      name: 'My Campaign',
      adType: 'USER',
      adFormat: 'BANNER',
      startDate: '2025-06-01',
      endDate: '2025-06-30',
      budget: 1000,
    };

    it('should accept valid campaign data', () => {
      const result = createCampaignSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should accept full campaign data with targeting', () => {
      const result = createCampaignSchema.safeParse({
        ...validData,
        boostType: 'PREMIUM',
        adText: 'Check this out!',
        destinationUrl: 'https://example.com',
        dailyBudget: 50,
        targeting: {
          locationName: 'New York',
          latitude: 40.7128,
          longitude: -74.0060,
          radiusKm: 25,
          ageMin: 18,
          ageMax: 45,
          gender: 'ALL',
          interests: ['tech', 'sports'],
          devices: ['mobile'],
          platforms: ['ios'],
        },
      });
      expect(result.success).toBe(true);
    });

    it('should reject empty name', () => {
      const result = createCampaignSchema.safeParse({ ...validData, name: '' });
      expect(result.success).toBe(false);
    });

    it('should reject invalid adType', () => {
      const result = createCampaignSchema.safeParse({ ...validData, adType: 'INVALID' });
      expect(result.success).toBe(false);
    });

    it('should reject invalid adFormat', () => {
      const result = createCampaignSchema.safeParse({ ...validData, adFormat: 'VIDEO' });
      expect(result.success).toBe(false);
    });

    it('should reject negative budget', () => {
      const result = createCampaignSchema.safeParse({ ...validData, budget: -100 });
      expect(result.success).toBe(false);
    });

    it('should reject invalid destination URL', () => {
      const result = createCampaignSchema.safeParse({ ...validData, destinationUrl: 'not-a-url' });
      expect(result.success).toBe(false);
    });

    it('should reject invalid targeting latitude', () => {
      const result = createCampaignSchema.safeParse({
        ...validData,
        targeting: { latitude: 200 },
      });
      expect(result.success).toBe(false);
    });

    it('should coerce date strings to Date objects', () => {
      const result = createCampaignSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.startDate).toBeInstanceOf(Date);
        expect(result.data.endDate).toBeInstanceOf(Date);
      }
    });
  });

  describe('updateCampaignSchema', () => {
    it('should accept partial updates', () => {
      const result = updateCampaignSchema.safeParse({ name: 'Updated Name' });
      expect(result.success).toBe(true);
    });

    it('should accept empty object (no fields to update)', () => {
      const result = updateCampaignSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it('should reject invalid budget', () => {
      const result = updateCampaignSchema.safeParse({ budget: -50 });
      expect(result.success).toBe(false);
    });
  });

  describe('updateStatusSchema', () => {
    it('should accept REVIEW status', () => {
      const result = updateStatusSchema.safeParse({ status: 'REVIEW' });
      expect(result.success).toBe(true);
    });

    it('should accept DRAFT status', () => {
      const result = updateStatusSchema.safeParse({ status: 'DRAFT' });
      expect(result.success).toBe(true);
    });

    it('should accept ACTIVE status', () => {
      const result = updateStatusSchema.safeParse({ status: 'ACTIVE' });
      expect(result.success).toBe(true);
    });

    it('should accept PAUSED status', () => {
      const result = updateStatusSchema.safeParse({ status: 'PAUSED' });
      expect(result.success).toBe(true);
    });

    it('should reject COMPLETED status', () => {
      const result = updateStatusSchema.safeParse({ status: 'COMPLETED' });
      expect(result.success).toBe(false);
    });
  });

  describe('campaignQuerySchema', () => {
    it('should apply defaults for empty query', () => {
      const result = campaignQuerySchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(1);
        expect(result.data.limit).toBe(20);
        expect(result.data.sortBy).toBe('createdAt');
        expect(result.data.sortOrder).toBe('desc');
      }
    });

    it('should coerce string numbers from query params', () => {
      const result = campaignQuerySchema.safeParse({ page: '2', limit: '50' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(2);
        expect(result.data.limit).toBe(50);
      }
    });

    it('should accept all filter fields', () => {
      const result = campaignQuerySchema.safeParse({
        search: 'test',
        status: 'ACTIVE',
        adFormat: 'BANNER',
        adType: 'USER',
        dateFrom: '2025-01-01',
        dateTo: '2025-12-31',
      });
      expect(result.success).toBe(true);
    });

    it('should reject limit over 100', () => {
      const result = campaignQuerySchema.safeParse({ limit: '200' });
      expect(result.success).toBe(false);
    });
  });

  describe('idParamSchema', () => {
    it('should accept valid ObjectId string', () => {
      const result = idParamSchema.safeParse({ id: '507f1f77bcf86cd799439011' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe('507f1f77bcf86cd799439011');
      }
    });

    it('should reject short string', () => {
      const result = idParamSchema.safeParse({ id: '123' });
      expect(result.success).toBe(false);
    });

    it('should reject non-hex string', () => {
      const result = idParamSchema.safeParse({ id: 'zzzzzzzzzzzzzzzzzzzzzzzz' });
      expect(result.success).toBe(false);
    });
  });
});
