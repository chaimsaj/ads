import { mapEnum } from '../../../infrastructure/utils/enum-mapper';
import type { CampaignWithRelations, CampaignWithUser } from '../interfaces/campaign-repository.interface';
import type { CampaignDTO, CampaignDetailDTO, TargetingDTO } from '../types/campaign.types';

export function toCampaignDTO(campaign: CampaignWithUser): CampaignDTO {
  const impressions = campaign.impressions;
  const clicks = campaign.clicks;
  const ctr = impressions > 0 ? Math.round((clicks / impressions) * 10000) / 100 : 0;

  return {
    id: campaign.id,
    userId: campaign.userId,
    name: campaign.name,
    adType: mapEnum(campaign.adType),
    boostType: mapEnum(campaign.boostType),
    adFormat: mapEnum(campaign.adFormat),
    status: mapEnum(campaign.status),
    adText: campaign.adText,
    bannerImage: campaign.bannerImage,
    destinationUrl: campaign.destinationUrl,
    brandName: campaign.brandName,
    brandTagline: campaign.brandTagline,
    startDate: campaign.startDate,
    endDate: campaign.endDate,
    budget: Number(campaign.budget),
    spent: Number(campaign.spent),
    dailyBudget: campaign.dailyBudget ? Number(campaign.dailyBudget) : null,
    impressions,
    clicks,
    conversions: campaign.conversions,
    ctr,
    reviewedBy: campaign.reviewedBy,
    reviewedAt: campaign.reviewedAt,
    rejectionReason: campaign.rejectionReason,
    createdAt: campaign.createdAt,
  };
}

export function toCampaignDetailDTO(campaign: CampaignWithRelations): CampaignDetailDTO {
  const base = toCampaignDTO(campaign);

  return {
    ...base,
    userName: campaign.user.name,
    userEmail: campaign.user.email,
    targeting: campaign.targeting ? toTargetingDTO(campaign.targeting) : null,
    dailyStats: (campaign.dailyStats ?? []).map((s) => ({
      date: s.statDate,
      impressions: s.impressions,
      clicks: s.clicks,
      conversions: s.conversions,
      spend: toNum(s.spend),
      ctr: s.ctr ? toNum(s.ctr) : null,
      cpc: s.cpc ? toNum(s.cpc) : null,
      cpm: s.cpm ? toNum(s.cpm) : null,
    })),
  };
}

function toTargetingDTO(t: NonNullable<CampaignWithRelations['targeting']>): TargetingDTO {
  return {
    locationName: t.locationName,
    latitude: t.latitude ? toNum(t.latitude) : null,
    longitude: t.longitude ? toNum(t.longitude) : null,
    radiusKm: t.radiusKm,
    ageMin: t.ageMin,
    ageMax: t.ageMax,
    gender: mapEnum(t.gender),
    interests: asStringArray(t.interests),
    devices: asStringArray(t.devices),
    platforms: asStringArray(t.platforms),
  };
}

function toNum(val: number): number {
  return val;
}

function asStringArray(val: unknown): readonly string[] {
  return Array.isArray(val) ? val.filter((v): v is string => typeof v === 'string') : [];
}
