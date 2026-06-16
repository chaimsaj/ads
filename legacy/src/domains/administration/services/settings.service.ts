import { mapEnum } from '../../../infrastructure/utils/enum-mapper';
import { NotFoundError } from '../../../infrastructure/errors';
import { createLogger } from '../../../infrastructure/logging/logger';
import type { IAuditLogRepository } from '../../identity/interfaces/audit-log-repository.interface';
import type { ISettingsRepository } from '../interfaces/settings-repository.interface';
import type { SystemSettingDTO, SystemSettingGrouped, UpdateSettingData } from '../types/administration.types';

const logger = createLogger('settings-service');

function toSettingDTO(setting: import('@prisma/client').SystemSetting): SystemSettingDTO {
  return {
    id: setting.id,
    settingKey: setting.settingKey,
    settingValue: setting.settingValue,
    settingType: mapEnum(setting.settingType),
    description: setting.description,
    isPublic: setting.isPublic,
    createdAt: setting.createdAt,
    updatedAt: setting.updatedAt,
  };
}

function groupByPrefix(settings: readonly SystemSettingDTO[]): SystemSettingGrouped {
  const groups: Record<string, SystemSettingDTO[]> = {};
  for (const setting of settings) {
    const prefix = setting.settingKey.split('_')[0] ?? 'general';
    if (!groups[prefix]) {
      groups[prefix] = [];
    }
    groups[prefix].push(setting);
  }
  return groups;
}

export class SettingsService {
  constructor(
    private readonly settingsRepo: ISettingsRepository,
    private readonly auditLogRepo: IAuditLogRepository,
  ) {}

  async getAll(): Promise<readonly SystemSettingDTO[]> {
    const settings = await this.settingsRepo.findAll();
    return settings.map(toSettingDTO);
  }

  async getGrouped(): Promise<SystemSettingGrouped> {
    const settings = await this.settingsRepo.findAll();
    return groupByPrefix(settings.map(toSettingDTO));
  }

  async getSingle(key: string): Promise<SystemSettingDTO> {
    const setting = await this.settingsRepo.findByKey(key);
    if (!setting) {
      throw new NotFoundError('Setting');
    }
    return toSettingDTO(setting);
  }

  async update(
    settings: readonly UpdateSettingData[],
    adminId: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<readonly SystemSettingDTO[]> {
    const results: SystemSettingDTO[] = [];

    for (const { key, value } of settings) {
      const oldSetting = await this.settingsRepo.findByKey(key);
      const updated = await this.settingsRepo.upsert(key, value, adminId);
      results.push(toSettingDTO(updated));

      await this.auditLogRepo.create({
        userType: 'ADMIN',
        userId: adminId,
        action: 'settings.update',
        entityType: 'SystemSetting',
        entityId: updated.id,
        oldValues: oldSetting ? { settingValue: oldSetting.settingValue } : undefined,
        newValues: { settingValue: value },
        ipAddress,
        userAgent,
      });
    }

    logger.info('Settings updated', { count: settings.length, adminId });
    return results;
  }
}
