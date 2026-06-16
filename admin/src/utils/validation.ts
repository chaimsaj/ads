import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export type LoginFormData = z.infer<typeof loginSchema>;

export const userUpdateSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  email: z.string().email('Invalid email address').optional(),
  role: z.enum(['admin', 'user', 'advertiser']).optional(),
  status: z.enum(['active', 'inactive', 'suspended']).optional(),
});

export type UserUpdateFormData = z.infer<typeof userUpdateSchema>;

export const campaignUpdateSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  status: z.enum(['active', 'paused', 'scheduled', 'completed', 'review', 'rejected']).optional(),
  budget: z.number().positive('Budget must be positive').optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export type CampaignUpdateFormData = z.infer<typeof campaignUpdateSchema>;

export const settingsSchema = z.object({
  siteName: z.string().min(1, 'Site name is required'),
  supportEmail: z.string().email('Invalid email address'),
  defaultCurrency: z.string().length(3, 'Currency must be 3 characters'),
  minBudget: z.number().positive('Min budget must be positive'),
  maxBudget: z.number().positive('Max budget must be positive'),
  commissionRate: z.number().min(0).max(100, 'Commission rate must be 0-100'),
  autoApprove: z.boolean(),
  maintenanceMode: z.boolean(),
});

export type SettingsFormData = z.infer<typeof settingsSchema>;

export function validateForm<T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; errors: Record<string, string> } {
  const result = schema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  const errors: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const path = issue.path.join('.');
    if (!errors[path]) {
      errors[path] = issue.message;
    }
  }

  return { success: false, errors };
}
