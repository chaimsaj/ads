import type { SystemSetting } from '@prisma/client';

export interface ISettingsRepository {
  findAll(): Promise<readonly SystemSetting[]>;
  findPublic(): Promise<readonly SystemSetting[]>;
  findByKey(key: string): Promise<SystemSetting | null>;
  upsert(key: string, value: string | null, updatedBy: string): Promise<SystemSetting>;
  bulkUpsert(settings: readonly { key: string; value: string | null }[], updatedBy: string): Promise<void>;
  getValue(key: string): Promise<string | null>;
}
