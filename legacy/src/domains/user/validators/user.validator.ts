import { z } from 'zod';

export const updateProfileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(255).optional(),
  phone: z.string().max(20).optional().nullable(),
  company: z.string().max(255).optional().nullable(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128)
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one digit')
    .regex(/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/, 'Password must contain at least one special character'),
});

export const notificationSettingsSchema = z.object({
  emailCampaignUpdates: z.boolean().optional(),
  emailWeeklyReports: z.boolean().optional(),
  emailBillingAlerts: z.boolean().optional(),
  emailProductNews: z.boolean().optional(),
  pushCampaignUpdates: z.boolean().optional(),
  pushBillingAlerts: z.boolean().optional(),
});
