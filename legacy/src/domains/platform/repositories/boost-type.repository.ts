import type { BoostTypeConfig, PrismaClient } from '@prisma/client';

import type { IBoostTypeRepository } from '../interfaces/boost-type-repository.interface';

export class BoostTypeRepository implements IBoostTypeRepository {
  constructor(private readonly db: PrismaClient) {}

  async findAllActive(): Promise<readonly BoostTypeConfig[]> {
    return this.db.boostTypeConfig.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  async findById(id: string): Promise<BoostTypeConfig | null> {
    return this.db.boostTypeConfig.findUnique({
      where: { id },
    });
  }
}
