import { z } from 'zod';
import { objectIdSchema, objectIdArraySchema } from '../../../shared/validators/objectid.validator';

export const rejectCampaignSchema = z.object({
  reason: z.string().min(1, 'Rejection reason is required').max(1000),
});

export const adminUpdateStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'PAUSED', 'SCHEDULED', 'COMPLETED']),
});

export const bulkStatusSchema = z.object({
  ids: objectIdArraySchema.max(100),
  status: z.enum(['ACTIVE', 'PAUSED', 'SCHEDULED', 'COMPLETED']),
});

export const bulkDeleteSchema = z.object({
  ids: objectIdArraySchema.max(100),
});

export const adminCampaignQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.enum(['createdAt', 'name', 'budget', 'spent', 'status', 'startDate']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  search: z.string().max(255).optional(),
  status: z.enum(['DRAFT', 'REVIEW', 'ACTIVE', 'PAUSED', 'SCHEDULED', 'COMPLETED', 'REJECTED']).optional(),
  adFormat: z.enum(['BANNER', 'INTERSTITIAL', 'PUSH']).optional(),
  adType: z.enum(['USER', 'EVENT', 'BRAND']).optional(),
  userId: objectIdSchema.optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
});

export const adminIdParamSchema = z.object({
  id: objectIdSchema,
});
