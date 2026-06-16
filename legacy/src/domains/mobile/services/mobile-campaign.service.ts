import { NotFoundError } from '../../../infrastructure/errors/not-found.error';
import type { IMobileCampaignRepository, MobileCampaignWithTargeting } from '../interfaces/mobile-campaign-repository.interface';
import type {
  MobileCampaignDetailDTO,
  MobileCampaignFilters,
  MobileCampaignListDTO,
  MobilePaginatedResult,
  MobilePaginationParams,
} from '../types/mobile.types';
import { haversineDistance } from './haversine';
import { toMobileCampaignDetailDTO, toMobileCampaignListDTO } from './mobile-campaign.transformer';

export class MobileCampaignService {
  constructor(private readonly campaignRepo: IMobileCampaignRepository) {}

  async listActiveCampaigns(
    filters: MobileCampaignFilters,
    pagination: MobilePaginationParams,
  ): Promise<MobilePaginatedResult<MobileCampaignListDTO>> {
    const campaigns = await this.campaignRepo.findActiveCampaigns({
      adType: filters.adType,
      adFormat: filters.adFormat,
    });

    const filtered = this.applyGeoFilter(campaigns, filters.latitude, filters.longitude);

    const total = filtered.length;
    const totalPages = Math.max(1, Math.ceil(total / pagination.limit));
    const page = Math.min(pagination.page, totalPages);
    const start = (page - 1) * pagination.limit;
    const paged = filtered.slice(start, start + pagination.limit);

    return {
      data: paged.map(toMobileCampaignListDTO),
      meta: { total, page, limit: pagination.limit, totalPages },
    };
  }

  async getActiveCampaign(id: string): Promise<MobileCampaignDetailDTO> {
    const campaign = await this.campaignRepo.findActiveCampaignById(id);

    if (!campaign) {
      throw new NotFoundError('Campaign');
    }

    return toMobileCampaignDetailDTO(campaign);
  }

  private applyGeoFilter(
    campaigns: readonly MobileCampaignWithTargeting[],
    latitude?: number,
    longitude?: number,
  ): readonly MobileCampaignWithTargeting[] {
    if (latitude == null || longitude == null) {
      return campaigns;
    }

    return campaigns.filter((campaign) => {
      const targeting = campaign.targeting;

      if (!targeting || targeting.latitude == null || targeting.longitude == null) {
        return true;
      }

      const distance = haversineDistance(
        latitude,
        longitude,
        Number(targeting.latitude),
        Number(targeting.longitude),
      );

      return distance <= targeting.radiusKm;
    });
  }
}
