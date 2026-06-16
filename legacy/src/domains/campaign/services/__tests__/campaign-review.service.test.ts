import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Campaign, AdType, BoostType, AdFormat, CampaignStatus } from '@prisma/client';

import { mockObjectId } from '../../../../../tests/helpers/objectid-helper';
import type { IAuditLogRepository } from '../../../identity/interfaces/audit-log-repository.interface';
import type { ICampaignRepository, CampaignWithUser, CampaignWithRelations } from '../../interfaces/campaign-repository.interface';
import { CampaignReviewService } from '../campaign-review.service';

function createMockCampaign(overrides: Partial<Campaign> = {}): Campaign {
  return {
    id: mockObjectId(1),
    userId: mockObjectId(10),
    name: 'Test Campaign',
    adType: 'USER' as AdType,
    boostType: 'STANDARD' as BoostType,
    adFormat: 'BANNER' as AdFormat,
    status: 'REVIEW' as CampaignStatus,
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
    review: vi.fn().mockResolvedValue(createMockCampaign({ status: 'SCHEDULED' as CampaignStatus })),
    softDelete: vi.fn().mockResolvedValue(undefined),
    duplicate: vi.fn().mockResolvedValue(createMockCampaign()),
    countByStatus: vi.fn().mockResolvedValue([
      { status: 'ACTIVE', count: 5 },
      { status: 'REVIEW', count: 3 },
    ]),
    getStatisticsForUser: vi.fn().mockResolvedValue({
      totalCampaigns: 0, activeCampaigns: 0, totalBudget: 0,
      totalSpent: 0, totalImpressions: 0, totalClicks: 0, totalConversions: 0,
    }),
  };
}

function createMockAuditLogRepo(): IAuditLogRepository {
  return {
    create: vi.fn().mockResolvedValue(undefined),
  };
}

describe('CampaignReviewService', () => {
  let service: CampaignReviewService;
  let campaignRepo: ICampaignRepository;
  let auditLogRepo: IAuditLogRepository;

  beforeEach(() => {
    campaignRepo = createMockCampaignRepo();
    auditLogRepo = createMockAuditLogRepo();
    service = new CampaignReviewService(campaignRepo, auditLogRepo);
  });

  describe('listAll', () => {
    it('should return paginated campaigns', async () => {
      const result = await service.listAll({}, { page: 1, limit: 20 });

      expect(result.data).toHaveLength(0);
      expect(campaignRepo.findMany).toHaveBeenCalledWith({}, { page: 1, limit: 20 });
    });
  });

  describe('getById', () => {
    it('should return campaign detail', async () => {
      (campaignRepo.findById as ReturnType<typeof vi.fn>).mockResolvedValue(
        createMockCampaignWithRelations(),
      );

      const result = await service.getById(mockObjectId(1));

      expect(result.id).toBe(mockObjectId(1));
    });

    it('should throw NotFoundError if not found', async () => {
      await expect(service.getById(mockObjectId(999))).rejects.toThrow('Campaign');
    });
  });

  describe('approve', () => {
    it('should approve campaign in REVIEW status', async () => {
      (campaignRepo.findById as ReturnType<typeof vi.fn>).mockResolvedValue(
        createMockCampaignWithRelations({ status: 'REVIEW' as CampaignStatus }),
      );

      const result = await service.approve(mockObjectId(1), mockObjectId(100), '127.0.0.1');

      expect(campaignRepo.review).toHaveBeenCalledWith(mockObjectId(1), mockObjectId(100), true);
      expect(auditLogRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'CAMPAIGN_APPROVED', entityId: mockObjectId(1) }),
      );
      expect(result).toBeDefined();
    });

    it('should throw if campaign is not in REVIEW status', async () => {
      (campaignRepo.findById as ReturnType<typeof vi.fn>).mockResolvedValue(
        createMockCampaignWithRelations({ status: 'ACTIVE' as CampaignStatus }),
      );

      await expect(service.approve(mockObjectId(1), mockObjectId(100), '127.0.0.1')).rejects.toThrow('Validation failed');
    });

    it('should throw NotFoundError if campaign not found', async () => {
      await expect(service.approve(mockObjectId(999), mockObjectId(100), '127.0.0.1')).rejects.toThrow('Campaign');
    });
  });

  describe('reject', () => {
    it('should reject campaign with reason', async () => {
      (campaignRepo.findById as ReturnType<typeof vi.fn>).mockResolvedValue(
        createMockCampaignWithRelations({ status: 'REVIEW' as CampaignStatus }),
      );
      (campaignRepo.review as ReturnType<typeof vi.fn>).mockResolvedValue(
        createMockCampaign({ status: 'REJECTED' as CampaignStatus }),
      );

      const result = await service.reject(mockObjectId(1), mockObjectId(100), 'Policy violation', '127.0.0.1');

      expect(campaignRepo.review).toHaveBeenCalledWith(mockObjectId(1), mockObjectId(100), false, 'Policy violation');
      expect(auditLogRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'CAMPAIGN_REJECTED' }),
      );
      expect(result).toBeDefined();
    });

    it('should throw if campaign is not in REVIEW status', async () => {
      (campaignRepo.findById as ReturnType<typeof vi.fn>).mockResolvedValue(
        createMockCampaignWithRelations({ status: 'DRAFT' as CampaignStatus }),
      );

      await expect(service.reject(mockObjectId(1), mockObjectId(100), 'Reason', '127.0.0.1')).rejects.toThrow('Validation failed');
    });
  });

  describe('updateStatus', () => {
    it('should update status for allowed campaigns', async () => {
      (campaignRepo.findById as ReturnType<typeof vi.fn>).mockResolvedValue(
        createMockCampaignWithRelations({ status: 'ACTIVE' as CampaignStatus }),
      );
      (campaignRepo.updateStatus as ReturnType<typeof vi.fn>).mockResolvedValue(
        createMockCampaign({ status: 'PAUSED' as CampaignStatus }),
      );

      const result = await service.updateStatus(mockObjectId(1), 'PAUSED', mockObjectId(100), '127.0.0.1');

      expect(campaignRepo.updateStatus).toHaveBeenCalledWith(mockObjectId(1), 'PAUSED');
      expect(auditLogRepo.create).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should throw if campaign status is not allowed for change', async () => {
      (campaignRepo.findById as ReturnType<typeof vi.fn>).mockResolvedValue(
        createMockCampaignWithRelations({ status: 'DRAFT' as CampaignStatus }),
      );

      await expect(service.updateStatus(mockObjectId(1), 'ACTIVE', mockObjectId(100), '127.0.0.1')).rejects.toThrow('Validation failed');
    });
  });

  describe('deleteCampaign', () => {
    it('should soft-delete campaign and log audit', async () => {
      (campaignRepo.findById as ReturnType<typeof vi.fn>).mockResolvedValue(
        createMockCampaignWithRelations(),
      );

      await service.deleteCampaign(mockObjectId(1), mockObjectId(100), '127.0.0.1');

      expect(campaignRepo.softDelete).toHaveBeenCalledWith(mockObjectId(1));
      expect(auditLogRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'CAMPAIGN_DELETED' }),
      );
    });

    it('should throw NotFoundError if campaign not found', async () => {
      await expect(service.deleteCampaign(mockObjectId(999), mockObjectId(100), '127.0.0.1')).rejects.toThrow('Campaign');
    });
  });

  describe('bulkUpdateStatus', () => {
    it('should update status for multiple campaigns', async () => {
      (campaignRepo.findById as ReturnType<typeof vi.fn>).mockResolvedValue(
        createMockCampaignWithRelations({ status: 'ACTIVE' as CampaignStatus }),
      );
      (campaignRepo.updateStatus as ReturnType<typeof vi.fn>).mockResolvedValue(
        createMockCampaign({ status: 'PAUSED' as CampaignStatus }),
      );

      const result = await service.bulkUpdateStatus([mockObjectId(1), mockObjectId(2)], 'PAUSED', mockObjectId(100), '127.0.0.1');

      expect(result.successful).toBe(2);
      expect(result.failed).toBe(0);
    });

    it('should collect errors for failed updates', async () => {
      (campaignRepo.findById as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce(createMockCampaignWithRelations({ status: 'ACTIVE' as CampaignStatus }))
        .mockResolvedValueOnce(null);
      (campaignRepo.updateStatus as ReturnType<typeof vi.fn>).mockResolvedValue(
        createMockCampaign({ status: 'PAUSED' as CampaignStatus }),
      );

      const result = await service.bulkUpdateStatus([mockObjectId(1), mockObjectId(2)], 'PAUSED', mockObjectId(100), '127.0.0.1');

      expect(result.successful).toBe(1);
      expect(result.failed).toBe(1);
      expect(result.errors).toHaveLength(1);
    });
  });

  describe('bulkDelete', () => {
    it('should delete multiple campaigns', async () => {
      (campaignRepo.findById as ReturnType<typeof vi.fn>).mockResolvedValue(
        createMockCampaignWithRelations(),
      );

      const result = await service.bulkDelete([mockObjectId(1), mockObjectId(2)], mockObjectId(100), '127.0.0.1');

      expect(result.successful).toBe(2);
      expect(result.failed).toBe(0);
    });
  });

  describe('getStatusCounts', () => {
    it('should return status counts', async () => {
      const result = await service.getStatusCounts();

      expect(result).toHaveLength(2);
      expect(campaignRepo.countByStatus).toHaveBeenCalled();
    });
  });
});
