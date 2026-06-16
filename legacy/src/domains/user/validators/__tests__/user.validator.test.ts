import { describe, it, expect } from 'vitest';

import {
  updateProfileSchema,
  changePasswordSchema,
  notificationSettingsSchema,
} from '../user.validator';

describe('User Validators', () => {
  describe('updateProfileSchema', () => {
    it('should accept valid profile update with all fields', () => {
      const result = updateProfileSchema.safeParse({
        name: 'Jane Doe',
        phone: '+1234567890',
        company: 'Acme Inc',
      });
      expect(result.success).toBe(true);
    });

    it('should accept empty object (no fields to update)', () => {
      const result = updateProfileSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it('should accept null for nullable fields', () => {
      const result = updateProfileSchema.safeParse({
        phone: null,
        company: null,
      });
      expect(result.success).toBe(true);
    });

    it('should reject name shorter than 2 characters', () => {
      const result = updateProfileSchema.safeParse({ name: 'A' });
      expect(result.success).toBe(false);
    });

    it('should reject name exceeding 255 characters', () => {
      const result = updateProfileSchema.safeParse({ name: 'A'.repeat(256) });
      expect(result.success).toBe(false);
    });

    it('should reject phone exceeding 20 characters', () => {
      const result = updateProfileSchema.safeParse({ phone: '1'.repeat(21) });
      expect(result.success).toBe(false);
    });
  });

  describe('changePasswordSchema', () => {
    it('should accept valid password change', () => {
      const result = changePasswordSchema.safeParse({
        currentPassword: 'oldpassword',
        newPassword: 'NewStr0ng!Pass',
      });
      expect(result.success).toBe(true);
    });

    it('should reject empty current password', () => {
      const result = changePasswordSchema.safeParse({
        currentPassword: '',
        newPassword: 'NewStr0ng!Pass',
      });
      expect(result.success).toBe(false);
    });

    it('should reject new password shorter than 8 characters', () => {
      const result = changePasswordSchema.safeParse({
        currentPassword: 'anything',
        newPassword: 'Ab1!',
      });
      expect(result.success).toBe(false);
    });

    it('should reject new password without uppercase letter', () => {
      const result = changePasswordSchema.safeParse({
        currentPassword: 'anything',
        newPassword: 'nouppercase1!',
      });
      expect(result.success).toBe(false);
    });

    it('should reject new password without lowercase letter', () => {
      const result = changePasswordSchema.safeParse({
        currentPassword: 'anything',
        newPassword: 'NOLOWERCASE1!',
      });
      expect(result.success).toBe(false);
    });

    it('should reject new password without digit', () => {
      const result = changePasswordSchema.safeParse({
        currentPassword: 'anything',
        newPassword: 'NoDigitHere!',
      });
      expect(result.success).toBe(false);
    });

    it('should reject new password without special character', () => {
      const result = changePasswordSchema.safeParse({
        currentPassword: 'anything',
        newPassword: 'NoSpecialChar1',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('notificationSettingsSchema', () => {
    it('should accept valid notification settings', () => {
      const result = notificationSettingsSchema.safeParse({
        emailCampaignUpdates: true,
        emailWeeklyReports: false,
        emailBillingAlerts: true,
        emailProductNews: false,
        pushCampaignUpdates: true,
        pushBillingAlerts: false,
      });
      expect(result.success).toBe(true);
    });

    it('should accept empty object (all fields optional)', () => {
      const result = notificationSettingsSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it('should reject non-boolean value for notification field', () => {
      const result = notificationSettingsSchema.safeParse({
        emailCampaignUpdates: 'yes',
      });
      expect(result.success).toBe(false);
    });
  });
});
