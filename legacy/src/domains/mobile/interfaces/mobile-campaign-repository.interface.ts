export interface MobileCampaignWithTargeting {
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
  readonly targeting: {
    readonly locationName: string | null;
    readonly latitude: number | null;
    readonly longitude: number | null;
    readonly radiusKm: number;
    readonly ageMin: number;
    readonly ageMax: number;
    readonly gender: string;
    readonly interests: unknown;
    readonly devices: unknown;
    readonly platforms: unknown;
  } | null;
}

export interface MobileCampaignDBFilters {
  readonly adType?: string;
  readonly adFormat?: string;
}

export interface IMobileCampaignRepository {
  findActiveCampaigns(filters: MobileCampaignDBFilters): Promise<readonly MobileCampaignWithTargeting[]>;
  findActiveCampaignById(id: string): Promise<MobileCampaignWithTargeting | null>;
}
