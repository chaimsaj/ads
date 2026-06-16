import { NotFoundError } from '../../../infrastructure/errors';
import type { IBoostTypeRepository } from '../interfaces/boost-type-repository.interface';
import type { BoostTypeDTO } from '../types/platform.types';

export class BoostTypeService {
  constructor(private readonly boostTypeRepo: IBoostTypeRepository) {}

  async listActive(): Promise<readonly BoostTypeDTO[]> {
    const types = await this.boostTypeRepo.findAllActive();
    return types.map((t) => ({
      id: t.id,
      name: t.name,
      description: t.description,
      multiplier: Number(t.multiplier),
      features: t.features,
      isActive: t.isActive,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
    }));
  }

  async getById(id: string): Promise<BoostTypeDTO> {
    const type = await this.boostTypeRepo.findById(id);
    if (!type) {
      throw new NotFoundError('Boost type');
    }
    return {
      id: type.id,
      name: type.name,
      description: type.description,
      multiplier: Number(type.multiplier),
      features: type.features,
      isActive: type.isActive,
      createdAt: type.createdAt,
      updatedAt: type.updatedAt,
    };
  }
}
