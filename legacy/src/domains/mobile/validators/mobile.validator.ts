import { z } from 'zod';
import { objectIdSchema } from '../../../shared/validators/objectid.validator';

export const mobileCampaignQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(20),
    adType: z.enum(['USER', 'EVENT', 'BRAND']).optional(),
    adFormat: z.enum(['BANNER', 'INTERSTITIAL', 'PUSH']).optional(),
    latitude: z.coerce.number().min(-90).max(90).optional(),
    longitude: z.coerce.number().min(-180).max(180).optional(),
  })
  .refine(
    (data) => (data.latitude != null) === (data.longitude != null),
    { message: 'Both latitude and longitude must be provided together' },
  );

export const mobileIdParamSchema = z.object({
  id: objectIdSchema,
});
