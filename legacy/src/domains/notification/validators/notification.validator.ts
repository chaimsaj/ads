import { z } from 'zod';

export const sendEmailSchema = z.object({
  to: z.string().email('Invalid email address'),
  subject: z.string().min(1).max(500),
  text: z.string().max(50000).optional(),
  html: z.string().max(100000).optional(),
});

export const bulkEmailSchema = z.object({
  to: z.array(z.string().email('Invalid email address')).min(1).max(500),
  subject: z.string().min(1).max(500),
  text: z.string().max(50000).optional(),
  html: z.string().max(100000).optional(),
});

export const emailQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
