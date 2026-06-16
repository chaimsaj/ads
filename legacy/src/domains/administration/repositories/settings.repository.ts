import type { PrismaClient, SystemSetting } from '@prisma/client';

import type { ISettingsRepository } from '../interfaces/settings-repository.interface';

export class SettingsRepository implements ISettingsRepository {
  constructor(private readonly db: PrismaClient) {}

  async findAll(): Promise<readonly SystemSetting[]> {
    return this.db.systemSetting.findMany({
      orderBy: { settingKey: 'asc' },
    });
  }

  async findPublic(): Promise<readonly SystemSetting[]> {
    return this.db.systemSetting.findMany({
      where: { isPublic: true },
      orderBy: { settingKey: 'asc' },
    });
  }

  async findByKey(key: string): Promise<SystemSetting | null> {
    return this.db.systemSetting.findUnique({
      where: { settingKey: key },
    });
  }

  async upsert(key: string, value: string | null, updatedBy: string): Promise<SystemSetting> {
    return this.db.systemSetting.upsert({
      where: { settingKey: key },
      create: {
        settingKey: key,
        settingValue: value,
        updatedBy,
      },
      update: {
        settingValue: value,
        updatedBy,
      },
    });
  }

  async bulkUpsert(
    settings: readonly { key: string; value: string | null }[],
    updatedBy: string,
  ): Promise<void> {
    await this.db.$transaction(
      settings.map((s) =>
        this.db.systemSetting.upsert({
          where: { settingKey: s.key },
          create: {
            settingKey: s.key,
            settingValue: s.value,
            updatedBy,
          },
          update: {
            settingValue: s.value,
            updatedBy,
          },
        }),
      ),
    );
  }

  async getValue(key: string): Promise<string | null> {
    const setting = await this.db.systemSetting.findUnique({
      where: { settingKey: key },
      select: { settingValue: true },
    });
    return setting?.settingValue ?? null;
  }
}
