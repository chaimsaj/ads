import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Campaign, CampaignStatus, PrismaClient } from '@prisma/client';
import { Prisma } from '@prisma/client';

import { mockObjectId } from '../../../../../tests/helpers/objectid-helper';
import { CampaignRepository } from '../campaign.repository';
import type { CreateCampaignData, CreateTargetingData } from '../../types/campaign.types';

describe('CampaignRepository', () => {
  let repository: CampaignRepository;
  let mockPrisma: {
    campaign: {
      findFirst: ReturnType<typeof vi.fn>;
      findMany: ReturnType<typeof vi.fn>;
      findUniqueOrThrow: ReturnType<typeof vi.fn>;
      count: ReturnType<typeof vi.fn>;
      create: ReturnType<typeof vi.fn>;
      update: ReturnType<typeof vi.fn>;
      groupBy: ReturnType<typeof vi.fn>;
      aggregate: ReturnType<typeof vi.fn>;
    };
    campaignTargeting: {
      create: ReturnType<typeof vi.fn>;
      upsert: ReturnType<typeof vi.fn>;
    };
    $transaction: ReturnType<typeof vi.fn>;
  };

  const mockCampaign: Campaign = {
    id: mockObjectId(1),
    userId: mockObjectId(1),
    name: 'Test Campaign',
    adType: 'DISPLAY',
    boostType: 'STANDARD',
    adFormat: 'BANNER',
    adText: 'Test ad text',
    bannerImage: 'banner.jpg',
    destinationUrl: 'https://example.com',
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-01-31'),
    budget: 1000,
    dailyBudget: 100,
    spent: 0,
    impressions: 0,
    clicks: 0,
    conversions: 0,
    status: 'DRAFT',
    reviewedBy: null,
    reviewedAt: null,
    rejectionReason: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };

  const mockCampaignWithRelations = {
    ...mockCampaign,
    user: { id: mockObjectId(1), name: 'Test User', email: 'test@example.com' },
    reviewer: null,
    targeting: {
      locationName: 'New York',
      latitude: 40.7128,
      longitude: -74.006,
      radiusKm: 10,
      ageMin: 18,
      ageMax: 65,
      gender: 'ALL',
      interests: ['technology'],
      devices: ['mobile'],
      platforms: ['ios'],
    },
    dailyStats: [],
  };

  beforeEach(() => {
    mockPrisma = {
      campaign: {
        findFirst: vi.fn(),
        findMany: vi.fn(),
        findUniqueOrThrow: vi.fn(),
        count: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        groupBy: vi.fn(),
        aggregate: vi.fn(),
      },
      campaignTargeting: {
        create: vi.fn(),
        upsert: vi.fn(),
      },
      $transaction: vi.fn((fn) => fn(mockPrisma)),
    };

    repository = new CampaignRepository(mockPrisma as unknown as PrismaClient);
  });

  describe('findById', () => {
    it('should find campaign by id with deletedAt null', async () => {
      mockPrisma.campaign.findFirst.mockResolvedValue(mockCampaignWithRelations);

      const result = await repository.findById(mockObjectId(1));

      expect(mockPrisma.campaign.findFirst).toHaveBeenCalledWith({
        where: { id: mockObjectId(1), deletedAt: null },
        include: expect.objectContaining({
          user: expect.any(Object),
          reviewer: expect.any(Object),
          targeting: expect.any(Object),
          dailyStats: expect.any(Object),
        }),
      });
      expect(result).toEqual(mockCampaignWithRelations);
    });

    it('should return null when campaign not found', async () => {
      mockPrisma.campaign.findFirst.mockResolvedValue(null);

      const result = await repository.findById(mockObjectId(999));

      expect(result).toBeNull();
    });
  });

  describe('findByIdForUser', () => {
    it('should find campaign by id and userId', async () => {
      mockPrisma.campaign.findFirst.mockResolvedValue(mockCampaignWithRelations);

      const result = await repository.findByIdForUser(mockObjectId(1), mockObjectId(1));

      expect(mockPrisma.campaign.findFirst).toHaveBeenCalledWith({
        where: { id: mockObjectId(1), userId: mockObjectId(1), deletedAt: null },
        include: expect.any(Object),
      });
      expect(result).toEqual(mockCampaignWithRelations);
    });

    it('should return null when campaign belongs to different user', async () => {
      mockPrisma.campaign.findFirst.mockResolvedValue(null);

      const result = await repository.findByIdForUser(mockObjectId(1), mockObjectId(999));

      expect(result).toBeNull();
    });
  });

  describe('findMany', () => {
    it('should paginate results correctly', async () => {
      mockPrisma.campaign.findMany.mockResolvedValue([mockCampaignWithRelations]);
      mockPrisma.campaign.count.mockResolvedValue(1);

      const result = await repository.findMany(
        {},
        { page: 1, limit: 10, sortBy: 'createdAt', sortOrder: 'desc' },
      );

      expect(mockPrisma.campaign.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 0,
          take: 10,
          orderBy: { createdAt: 'desc' },
        }),
      );
      expect(result.meta).toEqual({
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      });
    });

    it('should apply status filter', async () => {
      mockPrisma.campaign.findMany.mockResolvedValue([]);
      mockPrisma.campaign.count.mockResolvedValue(0);

      await repository.findMany(
        { status: 'ACTIVE' },
        { page: 1, limit: 10 },
      );

      expect(mockPrisma.campaign.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'ACTIVE',
            deletedAt: null,
          }),
        }),
      );
    });

    it('should apply search filter', async () => {
      mockPrisma.campaign.findMany.mockResolvedValue([]);
      mockPrisma.campaign.count.mockResolvedValue(0);

      await repository.findMany(
        { search: 'test' },
        { page: 1, limit: 10 },
      );

      expect(mockPrisma.campaign.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: [
              { name: { contains: 'test' } },
              { adText: { contains: 'test' } },
            ],
          }),
        }),
      );
    });

    it('should apply date range filter', async () => {
      const dateFrom = new Date('2024-01-01');
      const dateTo = new Date('2024-01-31');
      mockPrisma.campaign.findMany.mockResolvedValue([]);
      mockPrisma.campaign.count.mockResolvedValue(0);

      await repository.findMany(
        { dateFrom, dateTo },
        { page: 1, limit: 10 },
      );

      expect(mockPrisma.campaign.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            createdAt: { gte: dateFrom, lte: dateTo },
          }),
        }),
      );
    });

    it('should calculate correct totalPages', async () => {
      mockPrisma.campaign.findMany.mockResolvedValue([]);
      mockPrisma.campaign.count.mockResolvedValue(25);

      const result = await repository.findMany(
        {},
        { page: 1, limit: 10 },
      );

      expect(result.meta.totalPages).toBe(3);
    });

    it('should calculate skip correctly for page 2', async () => {
      mockPrisma.campaign.findMany.mockResolvedValue([]);
      mockPrisma.campaign.count.mockResolvedValue(0);

      await repository.findMany(
        {},
        { page: 2, limit: 10 },
      );

      expect(mockPrisma.campaign.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10,
          take: 10,
        }),
      );
    });
  });

  describe('findManyForUser', () => {
    it('should include userId in filters', async () => {
      mockPrisma.campaign.findMany.mockResolvedValue([]);
      mockPrisma.campaign.count.mockResolvedValue(0);

      await repository.findManyForUser(
        mockObjectId(5),
        { status: 'ACTIVE' },
        { page: 1, limit: 10 },
      );

      expect(mockPrisma.campaign.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId: mockObjectId(5),
            status: 'ACTIVE',
          }),
        }),
      );
    });
  });

  describe('create', () => {
    const createData: CreateCampaignData = {
      userId: mockObjectId(1),
      name: 'New Campaign',
      adType: 'DISPLAY',
      adFormat: 'BANNER',
      adText: 'Test ad',
      bannerImage: 'image.jpg',
      destinationUrl: 'https://example.com',
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-01-31'),
      budget: 1000,
      dailyBudget: 100,
    };

    it('should create campaign with default status DRAFT', async () => {
      mockPrisma.campaign.create.mockResolvedValue(mockCampaign);

      await repository.create(createData);

      expect(mockPrisma.campaign.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          status: 'DRAFT',
          boostType: 'STANDARD',
        }),
      });
    });

    it('should create campaign with targeting', async () => {
      const targetingData: CreateTargetingData = {
        locationName: 'New York',
        latitude: 40.7128,
        longitude: -74.006,
        radiusKm: 15,
        ageMin: 25,
        ageMax: 55,
        gender: 'ALL',
      };

      mockPrisma.campaign.create.mockResolvedValue(mockCampaign);
      mockPrisma.campaignTargeting.create.mockResolvedValue({});

      await repository.create(createData, targetingData);

      expect(mockPrisma.campaignTargeting.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          campaignId: mockCampaign.id,
          locationName: 'New York',
          radiusKm: 15,
          ageMin: 25,
          ageMax: 55,
        }),
      });
    });

    it('should use default targeting values when not provided', async () => {
      const minimalTargeting: CreateTargetingData = {
        locationName: 'Test Location',
        latitude: 0,
        longitude: 0,
      };

      mockPrisma.campaign.create.mockResolvedValue(mockCampaign);
      mockPrisma.campaignTargeting.create.mockResolvedValue({});

      await repository.create(createData, minimalTargeting);

      expect(mockPrisma.campaignTargeting.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          radiusKm: 10,
          ageMin: 18,
          ageMax: 65,
          gender: 'ALL',
        }),
      });
    });
  });

  describe('update', () => {
    it('should update campaign fields', async () => {
      mockPrisma.campaign.update.mockResolvedValue({ ...mockCampaign, name: 'Updated Name' });

      await repository.update(mockObjectId(1), { name: 'Updated Name' });

      expect(mockPrisma.campaign.update).toHaveBeenCalledWith({
        where: { id: mockObjectId(1) },
        data: expect.objectContaining({
          name: 'Updated Name',
        }),
      });
    });

    it('should update campaign with targeting', async () => {
      mockPrisma.campaign.update.mockResolvedValue(mockCampaign);
      mockPrisma.campaignTargeting.upsert.mockResolvedValue({});

      await repository.update(mockObjectId(1), {
        name: 'Updated',
        targeting: {
          locationName: 'New Location',
          latitude: 45.0,
          longitude: -75.0,
        },
      });

      expect(mockPrisma.campaignTargeting.upsert).toHaveBeenCalledWith({
        where: { campaignId: mockObjectId(1) },
        create: expect.objectContaining({
          campaignId: mockObjectId(1),
          locationName: 'New Location',
        }),
        update: expect.objectContaining({
          locationName: 'New Location',
        }),
      });
    });

    it('should not update targeting if not provided', async () => {
      mockPrisma.campaign.update.mockResolvedValue(mockCampaign);

      await repository.update(mockObjectId(1), { name: 'Updated' });

      expect(mockPrisma.campaignTargeting.upsert).not.toHaveBeenCalled();
    });
  });

  describe('updateStatus', () => {
    it('should update campaign status', async () => {
      mockPrisma.campaign.update.mockResolvedValue({ ...mockCampaign, status: 'ACTIVE' });

      const result = await repository.updateStatus(mockObjectId(1), 'ACTIVE' as CampaignStatus);

      expect(mockPrisma.campaign.update).toHaveBeenCalledWith({
        where: { id: mockObjectId(1) },
        data: { status: 'ACTIVE' },
      });
      expect(result.status).toBe('ACTIVE');
    });
  });

  describe('review', () => {
    it('should approve campaign', async () => {
      const approvedCampaign = {
        ...mockCampaign,
        status: 'SCHEDULED',
        reviewedBy: mockObjectId(5),
        reviewedAt: expect.any(Date),
        rejectionReason: null,
      };
      mockPrisma.campaign.update.mockResolvedValue(approvedCampaign);

      const result = await repository.review(mockObjectId(1), mockObjectId(5), true);

      expect(mockPrisma.campaign.update).toHaveBeenCalledWith({
        where: { id: mockObjectId(1) },
        data: {
          status: 'SCHEDULED',
          reviewedBy: mockObjectId(5),
          reviewedAt: expect.any(Date),
          rejectionReason: null,
        },
      });
      expect(result.status).toBe('SCHEDULED');
    });

    it('should reject campaign with reason', async () => {
      const rejectedCampaign = {
        ...mockCampaign,
        status: 'REJECTED',
        reviewedBy: mockObjectId(5),
        reviewedAt: expect.any(Date),
        rejectionReason: 'Inappropriate content',
      };
      mockPrisma.campaign.update.mockResolvedValue(rejectedCampaign);

      const result = await repository.review(mockObjectId(1), mockObjectId(5), false, 'Inappropriate content');

      expect(mockPrisma.campaign.update).toHaveBeenCalledWith({
        where: { id: mockObjectId(1) },
        data: {
          status: 'REJECTED',
          reviewedBy: mockObjectId(5),
          reviewedAt: expect.any(Date),
          rejectionReason: 'Inappropriate content',
        },
      });
      expect(result.status).toBe('REJECTED');
    });
  });

  describe('softDelete', () => {
    it('should set deletedAt to current date', async () => {
      mockPrisma.campaign.update.mockResolvedValue({
        ...mockCampaign,
        deletedAt: expect.any(Date),
      });

      await repository.softDelete(mockObjectId(1));

      expect(mockPrisma.campaign.update).toHaveBeenCalledWith({
        where: { id: mockObjectId(1) },
        data: { deletedAt: expect.any(Date) },
      });
    });
  });

  describe('duplicate', () => {
    it('should duplicate campaign with new name', async () => {
      const sourceWithTargeting = {
        ...mockCampaign,
        targeting: {
          locationName: 'NY',
          latitude: 40.7,
          longitude: -74.0,
          radiusKm: 10,
          ageMin: 18,
          ageMax: 65,
          gender: 'ALL',
          interests: null,
          devices: null,
          platforms: null,
        },
      };
      mockPrisma.campaign.findUniqueOrThrow.mockResolvedValue(sourceWithTargeting);
      mockPrisma.campaign.create.mockResolvedValue({ ...mockCampaign, id: mockObjectId(2), name: 'Test Campaign (Copy)' });
      mockPrisma.campaignTargeting.create.mockResolvedValue({});

      const result = await repository.duplicate(mockObjectId(1), mockObjectId(1));

      expect(mockPrisma.campaign.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: 'Test Campaign (Copy)',
          status: 'DRAFT',
        }),
      });
      expect(result.id).toBe(mockObjectId(2));
    });

    it('should duplicate campaign without targeting', async () => {
      const sourceWithoutTargeting = { ...mockCampaign, targeting: null };
      mockPrisma.campaign.findUniqueOrThrow.mockResolvedValue(sourceWithoutTargeting);
      mockPrisma.campaign.create.mockResolvedValue({ ...mockCampaign, id: mockObjectId(2) });

      await repository.duplicate(mockObjectId(1), mockObjectId(1));

      expect(mockPrisma.campaignTargeting.create).not.toHaveBeenCalled();
    });
  });

  describe('countByStatus', () => {
    it('should return status counts', async () => {
      mockPrisma.campaign.groupBy.mockResolvedValue([
        { status: 'DRAFT', _count: 5 },
        { status: 'ACTIVE', _count: 10 },
        { status: 'PAUSED', _count: 3 },
      ]);

      const result = await repository.countByStatus();

      expect(mockPrisma.campaign.groupBy).toHaveBeenCalledWith({
        by: ['status'],
        where: { deletedAt: null },
        _count: true,
      });
      expect(result).toEqual([
        { status: 'DRAFT', count: 5 },
        { status: 'ACTIVE', count: 10 },
        { status: 'PAUSED', count: 3 },
      ]);
    });
  });

  describe('getStatisticsForUser', () => {
    it('should return user campaign statistics', async () => {
      mockPrisma.campaign.aggregate.mockResolvedValue({
        _count: 10,
        _sum: {
          budget: 50000,
          spent: 25000,
          impressions: 100000,
          clicks: 5000,
          conversions: 500,
        },
      });
      mockPrisma.campaign.count.mockResolvedValue(5);

      const result = await repository.getStatisticsForUser(mockObjectId(1));

      expect(result).toEqual({
        totalCampaigns: 10,
        activeCampaigns: 5,
        totalBudget: 50000,
        totalSpent: 25000,
        totalImpressions: 100000,
        totalClicks: 5000,
        totalConversions: 500,
      });
    });

    it('should handle null aggregate values', async () => {
      mockPrisma.campaign.aggregate.mockResolvedValue({
        _count: 0,
        _sum: {
          budget: null,
          spent: null,
          impressions: null,
          clicks: null,
          conversions: null,
        },
      });
      mockPrisma.campaign.count.mockResolvedValue(0);

      const result = await repository.getStatisticsForUser(mockObjectId(999));

      expect(result).toEqual({
        totalCampaigns: 0,
        activeCampaigns: 0,
        totalBudget: 0,
        totalSpent: 0,
        totalImpressions: 0,
        totalClicks: 0,
        totalConversions: 0,
      });
    });
  });
});
