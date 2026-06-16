import { z } from 'zod';

import { PASSWORD_REGEX, PASSWORD_MESSAGE } from '../../../shared/constants/regex.constants';

export const registerSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  email: z.string().email('Invalid email address').max(255),
  password: z.string().regex(PASSWORD_REGEX, PASSWORD_MESSAGE),
  phone: z.string().max(20).optional(),
  company: z.string().max(255).optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const verifyEmailSchema = z.object({
  email: z.string().email('Invalid email address'),
  code: z.string().length(6, 'Verification code must be 6 digits'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  password: z.string().regex(PASSWORD_REGEX, PASSWORD_MESSAGE),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().regex(PASSWORD_REGEX, PASSWORD_MESSAGE),
});
