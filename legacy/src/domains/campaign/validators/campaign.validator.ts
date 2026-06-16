import { z } from 'zod';
import { objectIdSchema } from '../../../shared/validators/objectid.validator';

const targetingSchema = z.object({
  locationName: z.string().max(255).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  radiusKm: z.number().int().min(1).max(500).optional(),
  ageMin: z.number().int().min(13).max(100).optional(),
  ageMax: z.number().int().min(13).max(100).optional(),
  gender: z.enum(['ALL', 'MALE', 'FEMALE']).optional(),
  interests: z.array(z.string()).max(50).optional(),
  devices: z.array(z.string()).max(10).optional(),
  platforms: z.array(z.string()).max(10).optional(),
});

export const createCampaignSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  adType: z.enum(['USER', 'EVENT', 'BRAND']),
  boostType: z.enum(['STANDARD', 'PREMIUM']).optional(),
  adFormat: z.enum(['BANNER', 'INTERSTITIAL', 'PUSH']),
  adText: z.string().max(1000).optional(),
  bannerImage: z.string().url('Invalid banner image URL').max(500).optional(),
  destinationUrl: z.string().url('Invalid destination URL').max(500).optional(),
  brandName: z.string().max(255).optional(),
  brandTagline: z.string().max(500).optional(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  budget: z.number().positive('Budget must be positive'),
  dailyBudget: z.number().positive('Daily budget must be positive').optional(),
  targeting: targetingSchema.optional(),
});

export const updateCampaignSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  adText: z.string().max(1000).optional(),
  bannerImage: z.string().url('Invalid banner image URL').max(500).optional(),
  destinationUrl: z.string().url('Invalid destination URL').max(500).optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  budget: z.number().positive('Budget must be positive').optional(),
  dailyBudget: z.number().positive('Daily budget must be positive').optional(),
  targeting: targetingSchema.optional(),
});

export const updateStatusSchema = z.object({
  status: z.enum(['REVIEW', 'DRAFT', 'ACTIVE', 'PAUSED']),
});

export const campaignQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.enum(['createdAt', 'name', 'budget', 'spent', 'status', 'startDate']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  search: z.string().max(255).optional(),
  status: z.enum(['DRAFT', 'REVIEW', 'ACTIVE', 'PAUSED', 'SCHEDULED', 'COMPLETED', 'REJECTED']).optional(),
  adFormat: z.enum(['BANNER', 'INTERSTITIAL', 'PUSH']).optional(),
  adType: z.enum(['USER', 'EVENT', 'BRAND']).optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
});

export const estimateSchema = z.object({
  budget: z.number().positive(),
  adFormat: z.enum(['BANNER', 'INTERSTITIAL', 'PUSH_NOTIFICATION']),
  durationDays: z.number().int().min(1).max(365),
  locationName: z.string().optional(),
});

export const idParamSchema = z.object({
  id: objectIdSchema,
});
