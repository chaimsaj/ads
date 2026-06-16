import { z } from 'zod';

const objectIdRegex = /^[a-f\d]{24}$/i;

export const trackImpressionSchema = z.object({
  campaignId: z.string().regex(objectIdRegex, 'Invalid campaign ID'),
  userId: z.string().optional(),
  deviceId: z.string().optional(),
  adFormat: z.string().optional(),
});

export const trackClickSchema = z.object({
  campaignId: z.string().regex(objectIdRegex, 'Invalid campaign ID'),
  userId: z.string().optional(),
  deviceId: z.string().optional(),
  adFormat: z.string().optional(),
  destinationUrl: z.string().url().optional(),
});

export const trackConversionSchema = z.object({
  campaignId: z.string().regex(objectIdRegex, 'Invalid campaign ID'),
  type: z.enum(['application', 'deposit']),
  userId: z.string().optional(),
  amount: z.number().optional(),
});
