import { z } from 'zod';
import { objectIdSchema, objectIdArraySchema } from '../../../shared/validators/objectid.validator';

export const adminUserIdParamSchema = z.object({
  id: objectIdSchema,
});

export const adminUserQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.enum(['name', 'email', 'createdAt', 'status', 'role']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  search: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']).optional(),
  role: z.enum(['USER', 'ADVERTISER', 'ADMIN', 'SUPER_ADMIN']).optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
});

export const adminUpdateUserSchema = z.object({
  name: z.string().min(2).max(255).optional(),
  email: z.string().email('Invalid email address').optional(),
  phone: z.string().max(20).optional().nullable(),
  company: z.string().max(255).optional().nullable(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']).optional(),
  role: z.enum(['USER', 'ADVERTISER']).optional(),
});

export const adminUpdateUserStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'SUSPENDED', 'INACTIVE']),
});

export const bulkUserActionSchema = z.object({
  ids: objectIdArraySchema.max(100),
  action: z.enum(['activate', 'suspend', 'delete']),
});
