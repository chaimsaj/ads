import { NotFoundError } from '../../../infrastructure/errors';
import type { IAdFormatRepository } from '../interfaces/ad-format-repository.interface';
import type { AdFormatDTO } from '../types/platform.types';

export class AdFormatService {
  constructor(private readonly adFormatRepo: IAdFormatRepository) {}

  async listActive(): Promise<readonly AdFormatDTO[]> {
    const formats = await this.adFormatRepo.findAllActive();
    return formats.map((f) => ({
      id: f.id,
      name: f.name,
      description: f.description,
      dimensions: f.dimensions,
      basePrice: Number(f.basePrice),
      minBudget: Number(f.minBudget),
      isActive: f.isActive,
      createdAt: f.createdAt,
      updatedAt: f.updatedAt,
    }));
  }

  async getById(id: string): Promise<AdFormatDTO> {
    const format = await this.adFormatRepo.findById(id);
    if (!format) {
      throw new NotFoundError('Ad format');
    }
    return {
      id: format.id,
      name: format.name,
      description: format.description,
      dimensions: format.dimensions,
      basePrice: Number(format.basePrice),
      minBudget: Number(format.minBudget),
      isActive: format.isActive,
      createdAt: format.createdAt,
      updatedAt: format.updatedAt,
    };
  }
}
