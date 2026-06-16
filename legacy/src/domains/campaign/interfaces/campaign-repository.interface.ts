import type { Campaign, CampaignStatus } from '@prisma/client';

import type {
  CampaignFilters,
  PaginatedResult,
  PaginationParams,
  CampaignStatusCount,
  CreateCampaignData,
  UpdateCampaignData,
  CreateTargetingData,
} from '../types/campaign.types';

export interface CampaignWithUser extends Campaign {
  user: { id: string; name: string; email: string };
}

export interface CampaignWithRelations extends Campaign {
  user: { id: string; name: string; email: string };
  reviewer: { id: string; name: string } | null;
  targeting: {
    locationName: string | null;
    latitude: number | null;
    longitude: number | null;
    radiusKm: number;
    ageMin: number;
    ageMax: number;
    gender: string;
    interests: unknown;
    devices: unknown;
    platforms: unknown;
  } | null;
  dailyStats: readonly {
    statDate: Date;
    impressions: number;
    clicks: number;
    conversions: number;
    spend: number;
    ctr: number | null;
    cpc: number | null;
    cpm: number | null;
  }[];
}

export interface ICampaignRepository {
  findById(id: string): Promise<CampaignWithRelations | null>;
  findByIdForUser(id: string, userId: string): Promise<CampaignWithRelations | null>;
  findMany(
    filters: CampaignFilters,
    pagination: PaginationParams,
  ): Promise<PaginatedResult<CampaignWithUser>>;
  findManyForUser(
    userId: string,
    filters: CampaignFilters,
    pagination: PaginationParams,
  ): Promise<PaginatedResult<CampaignWithUser>>;
  create(data: CreateCampaignData, targeting?: CreateTargetingData): Promise<Campaign>;
  update(id: string, data: UpdateCampaignData): Promise<Campaign>;
  updateStatus(id: string, status: CampaignStatus): Promise<Campaign>;
  review(id: string, reviewerId: string, approved: boolean, reason?: string): Promise<Campaign>;
  softDelete(id: string): Promise<void>;
  duplicate(id: string, userId: string): Promise<Campaign>;
  countByStatus(): Promise<readonly CampaignStatusCount[]>;
  getStatisticsForUser(userId: string): Promise<UserCampaignStats>;
}

export interface UserCampaignStats {
  readonly totalCampaigns: number;
  readonly activeCampaigns: number;
  readonly totalBudget: number;
  readonly totalSpent: number;
  readonly totalImpressions: number;
  readonly totalClicks: number;
  readonly totalConversions: number;
}
