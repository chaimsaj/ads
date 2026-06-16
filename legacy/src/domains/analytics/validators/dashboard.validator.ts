import { z } from 'zod';

export const dashboardQuerySchema = z.object({
  period: z.enum(['day', 'week', 'month', 'year']).default('month'),
});
