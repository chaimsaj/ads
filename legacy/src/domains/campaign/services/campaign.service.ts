import { mapEnum } from '../../../infrastructure/utils/enum-mapper';
import { NotFoundError, ForbiddenError, ValidationError } from '../../../infrastructure/errors';
import { createLogger } from '../../../infrastructure/logging/logger';
import type { ICampaignRepository } from '../interfaces/campaign-repository.interface';
import type {
  CampaignDTO,
  CampaignDetailDTO,
  CampaignFilters,
  CampaignStatistics,
  CreateCampaignData,
  PaginatedResult,
  PaginationParams,
  UpdateCampaignData,
} from '../types/campaign.types';
import { toCampaignDTO, toCampaignDetailDTO } from './campaign.transformer';

const logger = createLogger('campaign-service');

export class CampaignService {
  constructor(private readonly campaignRepo: ICampaignRepository) {}

  async listForUser(
    userId: string,
    filters: CampaignFilters,
    pagination: PaginationParams,
  ): Promise<PaginatedResult<CampaignDTO>> {
    const result = await this.campaignRepo.findManyForUser(userId, filters, pagination);
    return {
      data: result.data.map(toCampaignDTO),
      meta: result.meta,
    };
  }

  async getForUser(id: string, userId: string): Promise<CampaignDetailDTO> {
    const campaign = await this.campaignRepo.findByIdForUser(id, userId);
    if (!campaign) {
      throw new NotFoundError('Campaign');
    }
    return toCampaignDetailDTO(campaign);
  }

  async create(data: CreateCampaignData): Promise<CampaignDTO> {
    if (data.endDate <= data.startDate) {
      throw new ValidationError([{ field: 'endDate', message: 'End date must be after start date' }]);
    }

    const campaign = await this.campaignRepo.create(data, data.targeting);
    logger.info('Campaign created', { campaignId: campaign.id, userId: data.userId });

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
      impressions: 0,
      clicks: 0,
      conversions: 0,
      ctr: 0,
      reviewedBy: null,
      reviewedAt: null,
      rejectionReason: null,
      createdAt: campaign.createdAt,
    };
  }

  async updateForUser(
    id: string,
    userId: string,
    data: UpdateCampaignData,
  ): Promise<CampaignDTO> {
    const existing = await this.campaignRepo.findByIdForUser(id, userId);
    if (!existing) {
      throw new NotFoundError('Campaign');
    }

    if (!['DRAFT', 'REJECTED'].includes(existing.status)) {
      throw new ForbiddenError('Can only edit campaigns in DRAFT or REJECTED status');
    }

    await this.campaignRepo.update(id, data);
    const updated = await this.campaignRepo.findByIdForUser(id, userId);
    logger.info('Campaign updated', { campaignId: id, userId });

    return toCampaignDTO(updated!);
  }

  async updateStatusForUser(
    id: string,
    userId: string,
    status: string,
  ): Promise<CampaignDTO> {
    const campaign = await this.campaignRepo.findByIdForUser(id, userId);
    if (!campaign) {
      throw new NotFoundError('Campaign');
    }

    const transitions = (await import('../types/campaign.types')).CAMPAIGN_STATUS_TRANSITIONS;
    const allowed = transitions[campaign.status] ?? [];
    if (!allowed.includes(status)) {
      const friendlyMessages: Record<string, string> = {
        DRAFT: 'Cannot activate a Draft campaign. Submit it for review first.',
        COMPLETED: 'This campaign has ended and cannot be reactivated.',
        REVIEW: 'This campaign is under review. Please wait for approval.',
      };
      const message = friendlyMessages[campaign.status]
        ?? `Cannot transition from ${campaign.status} to ${status}`;
      throw new ValidationError([{
        field: 'status',
        message,
      }]);
    }

    const updated = await this.campaignRepo.updateStatus(id, status as never);
    logger.info('Campaign status updated', { campaignId: id, from: campaign.status, to: status });

    return toCampaignDTO({ ...updated, user: campaign.user });
  }

  async deleteForUser(id: string, userId: string): Promise<void> {
    const campaign = await this.campaignRepo.findByIdForUser(id, userId);
    if (!campaign) {
      throw new NotFoundError('Campaign');
    }

    await this.campaignRepo.softDelete(id);
    logger.info('Campaign deleted', { campaignId: id, userId });
  }

  async duplicateForUser(id: string, userId: string): Promise<CampaignDTO> {
    const campaign = await this.campaignRepo.findByIdForUser(id, userId);
    if (!campaign) {
      throw new NotFoundError('Campaign');
    }

    const newCampaign = await this.campaignRepo.duplicate(id, userId);
    logger.info('Campaign duplicated', { sourceId: id, newId: newCampaign.id, userId });

    return {
      id: newCampaign.id,
      userId: newCampaign.userId,
      name: newCampaign.name,
      adType: mapEnum(newCampaign.adType),
      boostType: mapEnum(newCampaign.boostType),
      adFormat: mapEnum(newCampaign.adFormat),
      status: mapEnum(newCampaign.status),
      adText: newCampaign.adText,
      bannerImage: newCampaign.bannerImage,
      destinationUrl: newCampaign.destinationUrl,
      brandName: newCampaign.brandName,
      brandTagline: newCampaign.brandTagline,
      startDate: newCampaign.startDate,
      endDate: newCampaign.endDate,
      budget: Number(newCampaign.budget),
      spent: 0,
      dailyBudget: newCampaign.dailyBudget ? Number(newCampaign.dailyBudget) : null,
      impressions: 0,
      clicks: 0,
      conversions: 0,
      ctr: 0,
      reviewedBy: null,
      reviewedAt: null,
      rejectionReason: null,
      createdAt: newCampaign.createdAt,
    };
  }

  async getStatisticsForUser(userId: string): Promise<CampaignStatistics> {
    const stats = await this.campaignRepo.getStatisticsForUser(userId);
    const ctr =
      stats.totalImpressions > 0
        ? Math.round((stats.totalClicks / stats.totalImpressions) * 10000) / 100
        : 0;

    return { ...stats, averageCtr: ctr };
  }
}
