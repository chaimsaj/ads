import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { SystemSetting, SettingType } from '@prisma/client';

import { mockObjectId } from '../../../../../tests/helpers/objectid-helper';
import type { IAuditLogRepository } from '../../../identity/interfaces/audit-log-repository.interface';
import type { ISettingsRepository } from '../../interfaces/settings-repository.interface';
import { SettingsService } from '../settings.service';

function createMockSetting(overrides: Partial<SystemSetting> = {}): SystemSetting {
  return {
    id: mockObjectId(1),
    settingKey: 'site_name',
    settingValue: 'Myngly Ads',
    settingType: 'STRING' as SettingType,
    description: 'Site name',
    isPublic: true,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
    updatedBy: null,
    ...overrides,
  };
}

function createMockSettingsRepo(): ISettingsRepository {
  return {
    findAll: vi.fn().mockResolvedValue([]),
    findPublic: vi.fn().mockResolvedValue([]),
    findByKey: vi.fn().mockResolvedValue(null),
    upsert: vi.fn().mockResolvedValue(createMockSetting()),
    bulkUpsert: vi.fn().mockResolvedValue(undefined),
    getValue: vi.fn().mockResolvedValue(null),
  };
}

function createMockAuditLogRepo(): IAuditLogRepository {
  return {
    create: vi.fn().mockResolvedValue(undefined),
  };
}

describe('SettingsService', () => {
  let service: SettingsService;
  let settingsRepo: ISettingsRepository;
  let auditLogRepo: IAuditLogRepository;

  beforeEach(() => {
    settingsRepo = createMockSettingsRepo();
    auditLogRepo = createMockAuditLogRepo();
    service = new SettingsService(settingsRepo, auditLogRepo);
  });

  describe('getAll', () => {
    it('should return all settings', async () => {
      const mockSettings = [
        createMockSetting(),
        createMockSetting({ id: mockObjectId(2), settingKey: 'billing_currency', settingValue: 'USD' }),
      ];
      (settingsRepo.findAll as ReturnType<typeof vi.fn>).mockResolvedValue(mockSettings);

      const result = await service.getAll();

      expect(result).toHaveLength(2);
      expect(result[0].settingKey).toBe('site_name');
    });
  });

  describe('getGrouped', () => {
    it('should group settings by key prefix', async () => {
      const mockSettings = [
        createMockSetting({ settingKey: 'site_name' }),
        createMockSetting({ id: mockObjectId(2), settingKey: 'site_url' }),
        createMockSetting({ id: mockObjectId(3), settingKey: 'billing_currency' }),
      ];
      (settingsRepo.findAll as ReturnType<typeof vi.fn>).mockResolvedValue(mockSettings);

      const result = await service.getGrouped();

      expect(result.site).toHaveLength(2);
      expect(result.billing).toHaveLength(1);
    });
  });

  describe('getSingle', () => {
    it('should return setting by key', async () => {
      (settingsRepo.findByKey as ReturnType<typeof vi.fn>).mockResolvedValue(createMockSetting());

      const result = await service.getSingle('site_name');

      expect(result.settingKey).toBe('site_name');
      expect(settingsRepo.findByKey).toHaveBeenCalledWith('site_name');
    });

    it('should throw NotFoundError if setting not found', async () => {
      await expect(service.getSingle('nonexistent')).rejects.toThrow('Setting');
    });
  });

  describe('update', () => {
    it('should update settings and create audit logs', async () => {
      const updatedSetting = createMockSetting({ settingValue: 'New Name' });
      (settingsRepo.upsert as ReturnType<typeof vi.fn>).mockResolvedValue(updatedSetting);
      (settingsRepo.findByKey as ReturnType<typeof vi.fn>).mockResolvedValue(createMockSetting());

      const result = await service.update(
        [{ key: 'site_name', value: 'New Name' }],
        mockObjectId(1),
        '127.0.0.1',
        'test-agent',
      );

      expect(result).toHaveLength(1);
      expect(settingsRepo.upsert).toHaveBeenCalledWith('site_name', 'New Name', mockObjectId(1));
      expect(auditLogRepo.create).toHaveBeenCalledOnce();
    });
  });
});
