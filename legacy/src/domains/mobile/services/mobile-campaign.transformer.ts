import { mapEnum } from '../../../infrastructure/utils/enum-mapper';
import type { MobileCampaignWithTargeting } from '../interfaces/mobile-campaign-repository.interface';
import type {
  MobileCampaignDetailDTO,
  MobileCampaignListDTO,
  MobileTargetingDTO,
} from '../types/mobile.types';

export function toMobileCampaignListDTO(
  campaign: MobileCampaignWithTargeting,
): MobileCampaignListDTO {
  return {
    id: campaign.id,
    name: campaign.name,
    adType: mapEnum(campaign.adType),
    boostType: mapEnum(campaign.boostType),
    adFormat: mapEnum(campaign.adFormat),
    adText: campaign.adText,
    bannerImage: campaign.bannerImage,
    destinationUrl: campaign.destinationUrl,
    startDate: campaign.startDate,
    endDate: campaign.endDate,
    targeting: campaign.targeting ? toMobileTargetingDTO(campaign.targeting) : null,
  };
}

export function toMobileCampaignDetailDTO(
  campaign: MobileCampaignWithTargeting,
): MobileCampaignDetailDTO {
  const now = new Date();

  return {
    ...toMobileCampaignListDTO(campaign),
    schedule: {
      startDate: campaign.startDate,
      endDate: campaign.endDate,
      isCurrentlyActive: now >= campaign.startDate && now <= campaign.endDate,
    },
  };
}

function toMobileTargetingDTO(
  t: NonNullable<MobileCampaignWithTargeting['targeting']>,
): MobileTargetingDTO {
  return {
    locationName: t.locationName,
    latitude: t.latitude ? Number(t.latitude) : null,
    longitude: t.longitude ? Number(t.longitude) : null,
    radiusKm: t.radiusKm,
    ageMin: t.ageMin,
    ageMax: t.ageMax,
    gender: mapEnum(t.gender),
    interests: asStringArray(t.interests),
    devices: asStringArray(t.devices),
    platforms: asStringArray(t.platforms),
  };
}

function asStringArray(val: unknown): readonly string[] {
  return Array.isArray(val) ? val.filter((v): v is string => typeof v === 'string') : [];
}
