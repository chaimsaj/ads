import type { AdFormatConfig, PrismaClient } from '@prisma/client';

import type { IAdFormatRepository } from '../interfaces/ad-format-repository.interface';

export class AdFormatRepository implements IAdFormatRepository {
  constructor(private readonly db: PrismaClient) {}

  async findAllActive(): Promise<readonly AdFormatConfig[]> {
    return this.db.adFormatConfig.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  async findById(id: string): Promise<AdFormatConfig | null> {
    return this.db.adFormatConfig.findUnique({
      where: { id },
    });
  }
}
