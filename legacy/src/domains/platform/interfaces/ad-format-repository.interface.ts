import type { AdFormatConfig } from '@prisma/client';

export interface IAdFormatRepository {
  findAllActive(): Promise<readonly AdFormatConfig[]>;
  findById(id: string): Promise<AdFormatConfig | null>;
}
