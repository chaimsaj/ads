import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { AdFormatConfig } from '@prisma/client';

import { mockObjectId } from '../../../../../tests/helpers/objectid-helper';
import type { IAdFormatRepository } from '../../interfaces/ad-format-repository.interface';
import { AdFormatService } from '../ad-format.service';

function createMockAdFormat(overrides: Partial<AdFormatConfig> = {}): AdFormatConfig {
  return {
    id: mockObjectId(1),
    name: 'BANNER',
    description: 'Standard banner ad',
    dimensions: '728x90',
    basePrice: 10.0,
    minBudget: 50.0,
    isActive: true,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
    ...overrides,
  };
}

function createMockRepo(): IAdFormatRepository {
  return {
    findAllActive: vi.fn().mockResolvedValue([]),
    findById: vi.fn().mockResolvedValue(null),
  };
}

describe('AdFormatService', () => {
  let service: AdFormatService;
  let repo: IAdFormatRepository;

  beforeEach(() => {
    repo = createMockRepo();
    service = new AdFormatService(repo);
  });

  describe('listActive', () => {
    it('should return all active ad formats', async () => {
      const mockFormats = [createMockAdFormat(), createMockAdFormat({ id: mockObjectId(2), name: 'INTERSTITIAL' })];
      (repo.findAllActive as ReturnType<typeof vi.fn>).mockResolvedValue(mockFormats);

      const result = await service.listActive();

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('BANNER');
      expect(result[0].basePrice).toBe(10);
      expect(repo.findAllActive).toHaveBeenCalledOnce();
    });

    it('should return empty array when no formats exist', async () => {
      const result = await service.listActive();

      expect(result).toHaveLength(0);
    });
  });

  describe('getById', () => {
    it('should return ad format by id', async () => {
      (repo.findById as ReturnType<typeof vi.fn>).mockResolvedValue(createMockAdFormat());

      const result = await service.getById(mockObjectId(1));

      expect(result.id).toBe(mockObjectId(1));
      expect(result.name).toBe('BANNER');
      expect(result.basePrice).toBe(10);
      expect(repo.findById).toHaveBeenCalledWith(mockObjectId(1));
    });

    it('should throw NotFoundError if format not found', async () => {
      await expect(service.getById(mockObjectId(999))).rejects.toThrow('Ad format');
    });
  });
});
