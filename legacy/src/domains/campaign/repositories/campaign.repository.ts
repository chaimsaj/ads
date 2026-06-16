import type { Campaign, CampaignStatus, Prisma, PrismaClient } from '@prisma/client';

import type {
  ICampaignRepository,
  CampaignWithUser,
  CampaignWithRelations,
  UserCampaignStats,
} from '../interfaces/campaign-repository.interface';
import type {
  CampaignFilters,
  CampaignStatusCount,
  CreateCampaignData,
  CreateTargetingData,
  PaginatedResult,
  PaginationParams,
  UpdateCampaignData,
} from '../types/campaign.types';

const USER_SELECT = { id: true, name: true, email: true } as const;

const RELATIONS_INCLUDE = {
  user: { select: USER_SELECT },
  reviewer: { select: { id: true, name: true } },
  targeting: {
    select: {
      locationName: true,
      latitude: true,
      longitude: true,
      radiusKm: true,
      ageMin: true,
      ageMax: true,
      gender: true,
      interests: true,
      devices: true,
      platforms: true,
    },
  },
  dailyStats: {
    select: {
      statDate: true,
      impressions: true,
      clicks: true,
      conversions: true,
      spend: true,
      ctr: true,
      cpc: true,
      cpm: true,
    },
    orderBy: { statDate: 'desc' as const },
    take: 30,
  },
} as const;

export class CampaignRepository implements ICampaignRepository {
  constructor(private readonly db: PrismaClient) {}

  async findById(id: string): Promise<CampaignWithRelations | null> {
    return this.db.campaign.findFirst({
      where: { id, deletedAt: null },
      include: RELATIONS_INCLUDE,
    }) as Promise<CampaignWithRelations | null>;
  }

  async findByIdForUser(id: string, userId: string): Promise<CampaignWithRelations | null> {
    return this.db.campaign.findFirst({
      where: { id, userId, deletedAt: null },
      include: RELATIONS_INCLUDE,
    }) as Promise<CampaignWithRelations | null>;
  }

  async findMany(
    filters: CampaignFilters,
    pagination: PaginationParams,
  ): Promise<PaginatedResult<CampaignWithUser>> {
    const where = buildWhereClause(filters);
    const orderBy = { [pagination.sortBy ?? 'createdAt']: pagination.sortOrder ?? 'desc' };

    const [data, total] = await Promise.all([
      this.db.campaign.findMany({
        where,
        include: { user: { select: USER_SELECT } },
        orderBy,
        skip: (pagination.page - 1) * pagination.limit,
        take: pagination.limit,
      }),
      this.db.campaign.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page: pagination.page,
        limit: pagination.limit,
        totalPages: Math.ceil(total / pagination.limit),
      },
    };
  }

  async findManyForUser(
    userId: string,
    filters: CampaignFilters,
    pagination: PaginationParams,
  ): Promise<PaginatedResult<CampaignWithUser>> {
    return this.findMany({ ...filters, userId }, pagination);
  }

  async create(data: CreateCampaignData, targeting?: CreateTargetingData): Promise<Campaign> {
    return this.db.$transaction(async (tx) => {
      const campaign = await tx.campaign.create({
        data: {
          userId: data.userId,
          name: data.name,
          adType: data.adType,
          boostType: data.boostType ?? 'STANDARD',
          adFormat: data.adFormat,
          adText: data.adText,
          bannerImage: data.bannerImage,
          destinationUrl: data.destinationUrl,
          brandName: data.brandName,
          brandTagline: data.brandTagline,
          startDate: data.startDate,
          endDate: data.endDate,
          budget: data.budget,
          dailyBudget: data.dailyBudget,
          status: 'DRAFT',
          deletedAt: null,
        },
      });

      const targetingData = targeting ?? data.targeting;
      if (targetingData) {
        await tx.campaignTargeting.create({
          data: {
            campaignId: campaign.id,
            locationName: targetingData.locationName,
            latitude: targetingData.latitude,
            longitude: targetingData.longitude,
            radiusKm: targetingData.radiusKm ?? 10,
            ageMin: targetingData.ageMin ?? 18,
            ageMax: targetingData.ageMax ?? 65,
            gender: targetingData.gender ?? 'ALL',
            interests: (targetingData.interests as Prisma.InputJsonValue) ?? undefined,
            devices: (targetingData.devices as Prisma.InputJsonValue) ?? undefined,
            platforms: (targetingData.platforms as Prisma.InputJsonValue) ?? undefined,
          },
        });
      }

      return campaign;
    });
  }

  async update(id: string, data: UpdateCampaignData): Promise<Campaign> {
    return this.db.$transaction(async (tx) => {
      const campaign = await tx.campaign.update({
        where: { id },
        data: {
          ...(data.name !== undefined && { name: data.name }),
          ...(data.adText !== undefined && { adText: data.adText }),
          ...(data.bannerImage !== undefined && { bannerImage: data.bannerImage }),
          ...(data.destinationUrl !== undefined && { destinationUrl: data.destinationUrl }),
          ...(data.startDate !== undefined && { startDate: data.startDate }),
          ...(data.endDate !== undefined && { endDate: data.endDate }),
          ...(data.budget !== undefined && { budget: data.budget }),
          ...(data.dailyBudget !== undefined && { dailyBudget: data.dailyBudget }),
        },
      });

      if (data.targeting) {
        await tx.campaignTargeting.upsert({
          where: { campaignId: id },
          create: {
            campaignId: id,
            locationName: data.targeting.locationName,
            latitude: data.targeting.latitude,
            longitude: data.targeting.longitude,
            radiusKm: data.targeting.radiusKm ?? 10,
            ageMin: data.targeting.ageMin ?? 18,
            ageMax: data.targeting.ageMax ?? 65,
            gender: data.targeting.gender ?? 'ALL',
            interests: (data.targeting.interests as Prisma.InputJsonValue) ?? undefined,
            devices: (data.targeting.devices as Prisma.InputJsonValue) ?? undefined,
            platforms: (data.targeting.platforms as Prisma.InputJsonValue) ?? undefined,
          },
          update: {
            ...(data.targeting.locationName !== undefined && { locationName: data.targeting.locationName }),
            ...(data.targeting.latitude !== undefined && { latitude: data.targeting.latitude }),
            ...(data.targeting.longitude !== undefined && { longitude: data.targeting.longitude }),
            ...(data.targeting.radiusKm !== undefined && { radiusKm: data.targeting.radiusKm }),
            ...(data.targeting.ageMin !== undefined && { ageMin: data.targeting.ageMin }),
            ...(data.targeting.ageMax !== undefined && { ageMax: data.targeting.ageMax }),
            ...(data.targeting.gender !== undefined && { gender: data.targeting.gender }),
            ...(data.targeting.interests !== undefined && { interests: data.targeting.interests as Prisma.InputJsonValue }),
            ...(data.targeting.devices !== undefined && { devices: data.targeting.devices as Prisma.InputJsonValue }),
            ...(data.targeting.platforms !== undefined && { platforms: data.targeting.platforms as Prisma.InputJsonValue }),
          },
        });
      }

      return campaign;
    });
  }

  async updateStatus(id: string, status: CampaignStatus): Promise<Campaign> {
    return this.db.campaign.update({
      where: { id },
      data: { status },
    });
  }

  async review(
    id: string,
    reviewerId: string,
    approved: boolean,
    reason?: string,
  ): Promise<Campaign> {
    return this.db.campaign.update({
      where: { id },
      data: {
        status: approved ? 'SCHEDULED' : 'REJECTED',
        reviewedBy: reviewerId,
        reviewedAt: new Date(),
        rejectionReason: approved ? null : (reason ?? null),
      },
    });
  }

  async softDelete(id: string): Promise<void> {
    await this.db.campaign.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async duplicate(id: string, userId: string): Promise<Campaign> {
    return this.db.$transaction(async (tx) => {
      const source = await tx.campaign.findUniqueOrThrow({
        where: { id },
        include: { targeting: true },
      });

      const newCampaign = await tx.campaign.create({
        data: {
          userId,
          name: `${source.name} (Copy)`,
          adType: source.adType,
          boostType: source.boostType,
          adFormat: source.adFormat,
          adText: source.adText,
          bannerImage: source.bannerImage,
          destinationUrl: source.destinationUrl,
          brandName: source.brandName,
          brandTagline: source.brandTagline,
          startDate: source.startDate,
          endDate: source.endDate,
          budget: source.budget,
          dailyBudget: source.dailyBudget,
          status: 'DRAFT',
        },
      });

      if (source.targeting) {
        await tx.campaignTargeting.create({
          data: {
            campaignId: newCampaign.id,
            locationName: source.targeting.locationName,
            latitude: source.targeting.latitude,
            longitude: source.targeting.longitude,
            radiusKm: source.targeting.radiusKm,
            ageMin: source.targeting.ageMin,
            ageMax: source.targeting.ageMax,
            gender: source.targeting.gender,
            interests: source.targeting.interests ?? undefined,
            devices: source.targeting.devices ?? undefined,
            platforms: source.targeting.platforms ?? undefined,
          },
        });
      }

      return newCampaign;
    });
  }

  async countByStatus(): Promise<readonly CampaignStatusCount[]> {
    const result = await this.db.campaign.groupBy({
      by: ['status'],
      where: { deletedAt: null },
      _count: true,
    });
    return result.map((r) => ({ status: r.status, count: r._count }));
  }

  async getStatisticsForUser(userId: string): Promise<UserCampaignStats> {
    const [totals, activeCampaigns] = await Promise.all([
      this.db.campaign.aggregate({
        where: { userId, deletedAt: null },
        _count: true,
        _sum: { budget: true, spent: true, impressions: true, clicks: true, conversions: true },
      }),
      this.db.campaign.count({
        where: { userId, status: 'ACTIVE', deletedAt: null },
      }),
    ]);

    return {
      totalCampaigns: totals._count,
      activeCampaigns,
      totalBudget: totals._sum.budget ?? 0,
      totalSpent: totals._sum.spent ?? 0,
      totalImpressions: Number(totals._sum.impressions ?? 0),
      totalClicks: Number(totals._sum.clicks ?? 0),
      totalConversions: totals._sum.conversions ?? 0,
    };
  }
}

function buildWhereClause(filters: CampaignFilters): Prisma.CampaignWhereInput {
  const where: Prisma.CampaignWhereInput = { deletedAt: null };

  if (filters.search) {
    where.OR = [
      { name: { contains: filters.search } },
      { adText: { contains: filters.search } },
    ];
  }
  if (filters.status) where.status = filters.status;
  if (filters.adFormat) where.adFormat = filters.adFormat;
  if (filters.adType) where.adType = filters.adType;
  if (filters.userId) where.userId = filters.userId;

  if (filters.dateFrom || filters.dateTo) {
    where.createdAt = {
      ...(filters.dateFrom && { gte: filters.dateFrom }),
      ...(filters.dateTo && { lte: filters.dateTo }),
    };
  }

  return where;
}
