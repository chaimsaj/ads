import type { BoostTypeConfig } from '@prisma/client';

export interface IBoostTypeRepository {
  findAllActive(): Promise<readonly BoostTypeConfig[]>;
  findById(id: string): Promise<BoostTypeConfig | null>;
}
