import type { AdFormat, AdType, BoostType, CampaignStatus, Gender } from '@prisma/client';

// ---- Campaign DTOs ----

export interface CampaignDTO {
  readonly id: string;
  readonly userId: string;
  readonly name: string;
  readonly adType: string;
  readonly boostType: string;
  readonly adFormat: string;
  readonly status: string;
  readonly adText: string | null;
  readonly bannerImage: string | null;
  readonly destinationUrl: string | null;
  readonly brandName: string | null;
  readonly brandTagline: string | null;
  readonly startDate: Date;
  readonly endDate: Date;
  readonly budget: number;
  readonly spent: number;
  readonly dailyBudget: number | null;
  readonly impressions: number;
  readonly clicks: number;
  readonly conversions: number;
  readonly ctr: number;
  readonly reviewedBy: string | null;
  readonly reviewedAt: Date | null;
  readonly rejectionReason: string | null;
  readonly createdAt: Date;
}

export interface CampaignDetailDTO extends CampaignDTO {
  readonly userName?: string;
  readonly userEmail?: string;
  readonly targeting: TargetingDTO | null;
  readonly dailyStats: readonly DailyStatsDTO[];
}

export interface TargetingDTO {
  readonly locationName: string | null;
  readonly latitude: number | null;
  readonly longitude: number | null;
  readonly radiusKm: number;
  readonly ageMin: number;
  readonly ageMax: number;
  readonly gender: string;
  readonly interests: readonly string[];
  readonly devices: readonly string[];
  readonly platforms: readonly string[];
}

export interface DailyStatsDTO {
  readonly date: Date;
  readonly impressions: number;
  readonly clicks: number;
  readonly conversions: number;
  readonly spend: number;
  readonly ctr: number | null;
  readonly cpc: number | null;
  readonly cpm: number | null;
}

// ---- Create/Update DTOs ----

export interface CreateCampaignData {
  readonly userId: string;
  readonly name: string;
  readonly adType: AdType;
  readonly boostType?: BoostType;
  readonly adFormat: AdFormat;
  readonly adText?: string;
  readonly bannerImage?: string;
  readonly destinationUrl?: string;
  readonly brandName?: string;
  readonly brandTagline?: string;
  readonly startDate: Date;
  readonly endDate: Date;
  readonly budget: number;
  readonly dailyBudget?: number;
  readonly targeting?: CreateTargetingData;
}

export interface CreateTargetingData {
  readonly locationName?: string;
  readonly latitude?: number;
  readonly longitude?: number;
  readonly radiusKm?: number;
  readonly ageMin?: number;
  readonly ageMax?: number;
  readonly gender?: Gender;
  readonly interests?: readonly string[];
  readonly devices?: readonly string[];
  readonly platforms?: readonly string[];
}

export interface UpdateCampaignData {
  readonly name?: string;
  readonly adText?: string;
  readonly bannerImage?: string;
  readonly destinationUrl?: string;
  readonly startDate?: Date;
  readonly endDate?: Date;
  readonly budget?: number;
  readonly dailyBudget?: number;
  readonly targeting?: CreateTargetingData;
}

// ---- Filters & Pagination ----

export interface CampaignFilters {
  readonly search?: string;
  readonly status?: CampaignStatus;
  readonly adFormat?: AdFormat;
  readonly adType?: AdType;
  readonly userId?: string;
  readonly dateFrom?: Date;
  readonly dateTo?: Date;
}

export interface PaginationParams {
  readonly page: number;
  readonly limit: number;
  readonly sortBy?: string;
  readonly sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  readonly data: readonly T[];
  readonly meta: {
    readonly total: number;
    readonly page: number;
    readonly limit: number;
    readonly totalPages: number;
  };
}

// ---- Statistics ----

export interface CampaignStatistics {
  readonly totalCampaigns: number;
  readonly activeCampaigns: number;
  readonly totalBudget: number;
  readonly totalSpent: number;
  readonly totalImpressions: number;
  readonly totalClicks: number;
  readonly totalConversions: number;
  readonly averageCtr: number;
}

export interface CampaignStatusCount {
  readonly status: string;
  readonly count: number;
}

// ---- Bulk Actions ----

export interface BulkActionResult {
  readonly successful: number;
  readonly failed: number;
  readonly errors: readonly { readonly id: string; readonly error: string }[];
}

// ---- Status State Machine ----

export const CAMPAIGN_STATUS_TRANSITIONS: Record<string, readonly string[]> = {
  DRAFT: ['REVIEW'],
  REVIEW: ['SCHEDULED', 'REJECTED'],
  SCHEDULED: ['ACTIVE', 'PAUSED'],
  ACTIVE: ['PAUSED', 'COMPLETED'],
  PAUSED: ['ACTIVE', 'COMPLETED'],
  REJECTED: ['DRAFT'],
  COMPLETED: [],
} as const;
