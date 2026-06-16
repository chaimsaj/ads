import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Campaign, AdType, BoostType, AdFormat, CampaignStatus } from '@prisma/client';

import { mockObjectId } from '../../../../../tests/helpers/objectid-helper';
import type { ICampaignRepository, CampaignWithUser, CampaignWithRelations } from '../../interfaces/campaign-repository.interface';
import { CampaignService } from '../campaign.service';

function createMockCampaign(overrides: Partial<Campaign> = {}): Campaign {
  return {
    id: mockObjectId(1),
    userId: mockObjectId(10),
    name: 'Test Campaign',
    adType: 'USER' as AdType,
    boostType: 'STANDARD' as BoostType,
    adFormat: 'BANNER' as AdFormat,
    status: 'DRAFT' as CampaignStatus,
    adText: 'Ad text',
    bannerImage: null,
    destinationUrl: 'https://example.com',
    startDate: new Date('2025-06-01'),
    endDate: new Date('2025-06-30'),
    budget: 1000,
    spent: 0,
    dailyBudget: null,
    impressions: 0,
    clicks: 0,
    conversions: 0,
    reviewedBy: null,
    reviewedAt: null,
    rejectionReason: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    ...overrides,
  };
}

function createMockCampaignWithUser(overrides: Partial<Campaign> = {}): CampaignWithUser {
  return {
    ...createMockCampaign(overrides),
    user: { id: mockObjectId(10), name: 'Test User', email: 'test@example.com' },
  };
}

function createMockCampaignWithRelations(overrides: Partial<Campaign> = {}): CampaignWithRelations {
  return {
    ...createMockCampaign(overrides),
    user: { id: mockObjectId(10), name: 'Test User', email: 'test@example.com' },
    reviewer: null,
    targeting: null,
    dailyStats: [],
  };
}

function createMockCampaignRepo(): ICampaignRepository {
  return {
    findById: vi.fn().mockResolvedValue(null),
    findByIdForUser: vi.fn().mockResolvedValue(null),
    findMany: vi.fn().mockResolvedValue({ data: [], meta: { total: 0, page: 1, limit: 20, totalPages: 0 } }),
    findManyForUser: vi.fn().mockResolvedValue({ data: [], meta: { total: 0, page: 1, limit: 20, totalPages: 0 } }),
    create: vi.fn().mockResolvedValue(createMockCampaign()),
    update: vi.fn().mockResolvedValue(createMockCampaign()),
    updateStatus: vi.fn().mockResolvedValue(createMockCampaign()),
    review: vi.fn().mockResolvedValue(createMockCampaign()),
    softDelete: vi.fn().mockResolvedValue(undefined),
    duplicate: vi.fn().mockResolvedValue(createMockCampaign({ id: mockObjectId(2), name: 'Test Campaign (Copy)' })),
    countByStatus: vi.fn().mockResolvedValue([]),
    getStatisticsForUser: vi.fn().mockResolvedValue({
      totalCampaigns: 5,
      activeCampaigns: 2,
      totalBudget: 5000,
      totalSpent: 1500,
      totalImpressions: 10000,
      totalClicks: 500,
      totalConversions: 50,
    }),
  };
}

describe('CampaignService', () => {
  let service: CampaignService;
  let campaignRepo: ICampaignRepository;

  beforeEach(() => {
    campaignRepo = createMockCampaignRepo();
    service = new CampaignService(campaignRepo);
  });

  describe('listForUser', () => {
    it('should return paginated campaigns for user', async () => {
      const mockData = [createMockCampaignWithUser()];
      (campaignRepo.findManyForUser as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: mockData,
        meta: { total: 1, page: 1, limit: 20, totalPages: 1 },
      });

      const result = await service.listForUser(mockObjectId(10), {}, { page: 1, limit: 20 });

      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
      expect(campaignRepo.findManyForUser).toHaveBeenCalledWith(mockObjectId(10), {}, { page: 1, limit: 20 });
    });
  });

  describe('getForUser', () => {
    it('should return campaign detail for user', async () => {
      (campaignRepo.findByIdForUser as ReturnType<typeof vi.fn>).mockResolvedValue(
        createMockCampaignWithRelations(),
      );

      const result = await service.getForUser(mockObjectId(1), mockObjectId(10));

      expect(result.id).toBe(mockObjectId(1));
      expect(result.targeting).toBeNull();
      expect(result.dailyStats).toHaveLength(0);
    });

    it('should throw NotFoundError if campaign not found', async () => {
      await expect(service.getForUser(mockObjectId(999), mockObjectId(10))).rejects.toThrow('Campaign');
    });
  });

  describe('create', () => {
    it('should create campaign and return DTO', async () => {
      const data = {
        userId: mockObjectId(10),
        name: 'New Campaign',
        adType: 'USER' as AdType,
        adFormat: 'BANNER' as AdFormat,
        startDate: new Date('2025-06-01'),
        endDate: new Date('2025-06-30'),
        budget: 1000,
      };

      const result = await service.create(data);

      expect(result.id).toBe(mockObjectId(1));
      expect(result.impressions).toBe(0);
      expect(result.clicks).toBe(0);
      expect(campaignRepo.create).toHaveBeenCalledWith(data, undefined);
    });

    it('should throw ValidationError if endDate <= startDate', async () => {
      const data = {
        userId: mockObjectId(10),
        name: 'Bad Campaign',
        adType: 'USER' as AdType,
        adFormat: 'BANNER' as AdFormat,
        startDate: new Date('2025-06-30'),
        endDate: new Date('2025-06-01'),
        budget: 1000,
      };

      await expect(service.create(data)).rejects.toThrow();
    });
  });

  describe('updateForUser', () => {
    it('should update campaign in DRAFT status', async () => {
      (campaignRepo.findByIdForUser as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce(createMockCampaignWithRelations({ status: 'DRAFT' as CampaignStatus }))
        .mockResolvedValueOnce(createMockCampaignWithRelations({ name: 'Updated' }));

      const result = await service.updateForUser(mockObjectId(1), mockObjectId(10), { name: 'Updated' });

      expect(campaignRepo.update).toHaveBeenCalledWith(mockObjectId(1), { name: 'Updated' });
      expect(result).toBeDefined();
    });

    it('should throw ForbiddenError if campaign is ACTIVE', async () => {
      (campaignRepo.findByIdForUser as ReturnType<typeof vi.fn>).mockResolvedValue(
        createMockCampaignWithRelations({ status: 'ACTIVE' as CampaignStatus }),
      );

      await expect(service.updateForUser(mockObjectId(1), mockObjectId(10), { name: 'Updated' })).rejects.toThrow('DRAFT or REJECTED');
    });

    it('should throw NotFoundError if campaign not found', async () => {
      await expect(service.updateForUser(mockObjectId(999), mockObjectId(10), { name: 'Updated' })).rejects.toThrow('Campaign');
    });
  });

  describe('updateStatusForUser', () => {
    it('should transition from DRAFT to REVIEW', async () => {
      (campaignRepo.findByIdForUser as ReturnType<typeof vi.fn>).mockResolvedValue(
        createMockCampaignWithRelations({ status: 'DRAFT' as CampaignStatus }),
      );
      (campaignRepo.updateStatus as ReturnType<typeof vi.fn>).mockResolvedValue(
        createMockCampaign({ status: 'REVIEW' as CampaignStatus }),
      );

      const result = await service.updateStatusForUser(mockObjectId(1), mockObjectId(10), 'REVIEW');

      expect(result.status).toBe('review');
      expect(campaignRepo.updateStatus).toHaveBeenCalledWith(mockObjectId(1), 'REVIEW');
    });

    it('should reject invalid transitions', async () => {
      (campaignRepo.findByIdForUser as ReturnType<typeof vi.fn>).mockResolvedValue(
        createMockCampaignWithRelations({ status: 'DRAFT' as CampaignStatus }),
      );

      await expect(service.updateStatusForUser(mockObjectId(1), mockObjectId(10), 'ACTIVE')).rejects.toThrow('Validation failed');
    });
  });

  describe('deleteForUser', () => {
    it('should soft-delete campaign', async () => {
      (campaignRepo.findByIdForUser as ReturnType<typeof vi.fn>).mockResolvedValue(
        createMockCampaignWithRelations(),
      );

      await service.deleteForUser(mockObjectId(1), mockObjectId(10));

      expect(campaignRepo.softDelete).toHaveBeenCalledWith(mockObjectId(1));
    });

    it('should throw NotFoundError if campaign not found', async () => {
      await expect(service.deleteForUser(mockObjectId(999), mockObjectId(10))).rejects.toThrow('Campaign');
    });
  });

  describe('duplicateForUser', () => {
    it('should duplicate campaign', async () => {
      (campaignRepo.findByIdForUser as ReturnType<typeof vi.fn>).mockResolvedValue(
        createMockCampaignWithRelations(),
      );

      const result = await service.duplicateForUser(mockObjectId(1), mockObjectId(10));

      expect(result.id).toBe(mockObjectId(2));
      expect(result.name).toBe('Test Campaign (Copy)');
      expect(result.spent).toBe(0);
      expect(campaignRepo.duplicate).toHaveBeenCalledWith(mockObjectId(1), mockObjectId(10));
    });

    it('should throw NotFoundError if source campaign not found', async () => {
      await expect(service.duplicateForUser(mockObjectId(999), mockObjectId(10))).rejects.toThrow('Campaign');
    });
  });

  describe('getStatisticsForUser', () => {
    it('should return statistics with calculated CTR', async () => {
      const result = await service.getStatisticsForUser(mockObjectId(10));

      expect(result.totalCampaigns).toBe(5);
      expect(result.averageCtr).toBe(5);
      expect(campaignRepo.getStatisticsForUser).toHaveBeenCalledWith(mockObjectId(10));
    });

    it('should return 0 CTR when no impressions', async () => {
      (campaignRepo.getStatisticsForUser as ReturnType<typeof vi.fn>).mockResolvedValue({
        totalCampaigns: 0,
        activeCampaigns: 0,
        totalBudget: 0,
        totalSpent: 0,
        totalImpressions: 0,
        totalClicks: 0,
        totalConversions: 0,
      });

      const result = await service.getStatisticsForUser(mockObjectId(10));

      expect(result.averageCtr).toBe(0);
    });
  });
});
