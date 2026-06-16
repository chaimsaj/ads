import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { BoostTypeConfig } from '@prisma/client';

import { mockObjectId } from '../../../../../tests/helpers/objectid-helper';
import type { IBoostTypeRepository } from '../../interfaces/boost-type-repository.interface';
import { BoostTypeService } from '../boost-type.service';

function createMockBoostType(overrides: Partial<BoostTypeConfig> = {}): BoostTypeConfig {
  return {
    id: mockObjectId(1),
    name: 'STANDARD',
    description: 'Standard boost',
    multiplier: 1.0,
    features: null,
    isActive: true,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
    ...overrides,
  };
}

function createMockRepo(): IBoostTypeRepository {
  return {
    findAllActive: vi.fn().mockResolvedValue([]),
    findById: vi.fn().mockResolvedValue(null),
  };
}

describe('BoostTypeService', () => {
  let service: BoostTypeService;
  let repo: IBoostTypeRepository;

  beforeEach(() => {
    repo = createMockRepo();
    service = new BoostTypeService(repo);
  });

  describe('listActive', () => {
    it('should return all active boost types', async () => {
      const mockTypes = [createMockBoostType(), createMockBoostType({ id: mockObjectId(2), name: 'PREMIUM', multiplier: 2.0 })];
      (repo.findAllActive as ReturnType<typeof vi.fn>).mockResolvedValue(mockTypes);

      const result = await service.listActive();

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('STANDARD');
      expect(result[0].multiplier).toBe(1);
      expect(repo.findAllActive).toHaveBeenCalledOnce();
    });

    it('should return empty array when no boost types exist', async () => {
      const result = await service.listActive();

      expect(result).toHaveLength(0);
    });
  });

  describe('getById', () => {
    it('should return boost type by id', async () => {
      (repo.findById as ReturnType<typeof vi.fn>).mockResolvedValue(createMockBoostType());

      const result = await service.getById(mockObjectId(1));

      expect(result.id).toBe(mockObjectId(1));
      expect(result.name).toBe('STANDARD');
      expect(result.multiplier).toBe(1);
      expect(repo.findById).toHaveBeenCalledWith(mockObjectId(1));
    });

    it('should throw NotFoundError if boost type not found', async () => {
      await expect(service.getById(mockObjectId(999))).rejects.toThrow('Boost type');
    });
  });
});
