import { z } from 'zod';

import { PASSWORD_REGEX, PASSWORD_MESSAGE } from '../../../shared/constants/regex.constants';

export const adminLoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
  twoFactorCode: z.string().length(6).optional(),
});

export const adminChangePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().regex(PASSWORD_REGEX, PASSWORD_MESSAGE),
});

export const twoFactorVerifySchema = z.object({
  code: z.string().length(6, 'Code must be 6 digits'),
});
