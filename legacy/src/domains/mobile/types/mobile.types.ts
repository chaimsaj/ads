export interface MobileTargetingDTO {
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

export interface MobileCampaignListDTO {
  readonly id: string;
  readonly name: string;
  readonly adType: string;
  readonly boostType: string;
  readonly adFormat: string;
  readonly adText: string | null;
  readonly bannerImage: string | null;
  readonly destinationUrl: string | null;
  readonly startDate: Date;
  readonly endDate: Date;
  readonly targeting: MobileTargetingDTO | null;
}

export interface MobileCampaignDetailDTO extends MobileCampaignListDTO {
  readonly schedule: {
    readonly startDate: Date;
    readonly endDate: Date;
    readonly isCurrentlyActive: boolean;
  };
}

export interface MobileCampaignFilters {
  readonly adType?: string;
  readonly adFormat?: string;
  readonly latitude?: number;
  readonly longitude?: number;
}

export interface MobilePaginationParams {
  readonly page: number;
  readonly limit: number;
}

export interface MobilePaginatedResult<T> {
  readonly data: readonly T[];
  readonly meta: {
    readonly total: number;
    readonly page: number;
    readonly limit: number;
    readonly totalPages: number;
  };
}
