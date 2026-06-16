import { describe, it, expect } from 'vitest';

import { mockObjectId } from '../../../../../tests/helpers/objectid-helper';
import {
  auditLogQuerySchema,
  auditLogIdParamSchema,
  settingKeyParamSchema,
  updateSettingsSchema,
} from '../administration.validator';

describe('Administration Validators', () => {
  describe('auditLogQuerySchema', () => {
    it('should accept valid query with defaults', () => {
      const result = auditLogQuerySchema.parse({});
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
    });

    it('should accept valid filters', () => {
      const result = auditLogQuerySchema.parse({
        page: '2',
        limit: '50',
        userType: 'ADMIN',
        action: 'login',
      });
      expect(result.page).toBe(2);
      expect(result.limit).toBe(50);
      expect(result.userType).toBe('ADMIN');
    });

    it('should reject invalid userType', () => {
      expect(() => auditLogQuerySchema.parse({ userType: 'INVALID' })).toThrow();
    });
  });

  describe('auditLogIdParamSchema', () => {
    it('should accept valid ObjectId string', () => {
      const result = auditLogIdParamSchema.parse({ id: mockObjectId(1) });
      expect(result.id).toBe(mockObjectId(1));
    });

    it('should reject short string', () => {
      expect(() => auditLogIdParamSchema.parse({ id: '123' })).toThrow();
    });

    it('should reject non-hex string', () => {
      expect(() => auditLogIdParamSchema.parse({ id: 'zzzzzzzzzzzzzzzzzzzzzzzz' })).toThrow();
    });
  });

  describe('settingKeyParamSchema', () => {
    it('should accept valid key', () => {
      const result = settingKeyParamSchema.parse({ key: 'site_name' });
      expect(result.key).toBe('site_name');
    });

    it('should reject empty key', () => {
      expect(() => settingKeyParamSchema.parse({ key: '' })).toThrow();
    });
  });

  describe('updateSettingsSchema', () => {
    it('should accept valid settings array', () => {
      const result = updateSettingsSchema.parse({
        settings: [{ key: 'site_name', value: 'Test' }],
      });
      expect(result.settings).toHaveLength(1);
    });

    it('should accept nullable value', () => {
      const result = updateSettingsSchema.parse({
        settings: [{ key: 'site_name', value: null }],
      });
      expect(result.settings[0].value).toBeNull();
    });

    it('should reject empty settings array', () => {
      expect(() => updateSettingsSchema.parse({ settings: [] })).toThrow();
    });
  });
});
