import type { PrismaClient } from '@prisma/client';

import type {
  IMobileCampaignRepository,
  MobileCampaignDBFilters,
  MobileCampaignWithTargeting,
} from '../interfaces/mobile-campaign-repository.interface';

const MOBILE_CAMPAIGN_SELECT = {
  id: true,
  name: true,
  adType: true,
  boostType: true,
  adFormat: true,
  adText: true,
  bannerImage: true,
  destinationUrl: true,
  startDate: true,
  endDate: true,
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
} as const;

export class MobileCampaignRepository implements IMobileCampaignRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findActiveCampaigns(
    filters: MobileCampaignDBFilters,
  ): Promise<readonly MobileCampaignWithTargeting[]> {
    const now = new Date();

    return this.prisma.campaign.findMany({
      where: {
        status: 'ACTIVE',
        deletedAt: null,
        startDate: { lte: now },
        endDate: { gte: now },
        ...(filters.adType ? { adType: filters.adType as never } : {}),
        ...(filters.adFormat ? { adFormat: filters.adFormat as never } : {}),
      },
      select: MOBILE_CAMPAIGN_SELECT,
    });
  }

  async findActiveCampaignById(
    id: string,
  ): Promise<MobileCampaignWithTargeting | null> {
    const now = new Date();

    return this.prisma.campaign.findFirst({
      where: {
        id,
        status: 'ACTIVE',
        deletedAt: null,
        startDate: { lte: now },
        endDate: { gte: now },
      },
      select: MOBILE_CAMPAIGN_SELECT,
    });
  }
}
