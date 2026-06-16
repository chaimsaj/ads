import { z } from 'zod';
import { objectIdSchema } from '../../../shared/validators/objectid.validator';

export const auditLogQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  userType: z.enum(['USER', 'ADMIN', 'SYSTEM']).optional(),
  userId: objectIdSchema.optional(),
  action: z.string().max(100).optional(),
  entityType: z.string().max(50).optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
});

export const auditLogIdParamSchema = z.object({
  id: objectIdSchema,
});

export const settingKeyParamSchema = z.object({
  key: z.string().min(1).max(100),
});

export const updateSettingsSchema = z.object({
  settings: z.array(
    z.object({
      key: z.string().min(1).max(100),
      value: z.string().max(10000).nullable(),
    }),
  ).min(1).max(50),
});
