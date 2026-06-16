import { mapEnum } from '../../../infrastructure/utils/enum-mapper';
import { NotFoundError, ValidationError } from '../../../infrastructure/errors';
import { createLogger } from '../../../infrastructure/logging/logger';
import type { IAuditLogRepository } from '../../identity/interfaces/audit-log-repository.interface';
import type { ICampaignRepository } from '../interfaces/campaign-repository.interface';
import type {
  BulkActionResult,
  CampaignDTO,
  CampaignDetailDTO,
  CampaignFilters,
  CampaignStatusCount,
  PaginatedResult,
  PaginationParams,
} from '../types/campaign.types';
import { toCampaignDTO, toCampaignDetailDTO } from './campaign.transformer';

const logger = createLogger('campaign-review-service');

export class CampaignReviewService {
  constructor(
    private readonly campaignRepo: ICampaignRepository,
    private readonly auditLogRepo: IAuditLogRepository,
  ) {}

  async listAll(
    filters: CampaignFilters,
    pagination: PaginationParams,
  ): Promise<PaginatedResult<CampaignDTO>> {
    const result = await this.campaignRepo.findMany(filters, pagination);
    return {
      data: result.data.map(toCampaignDTO),
      meta: result.meta,
    };
  }

  async getById(id: string): Promise<CampaignDetailDTO> {
    const campaign = await this.campaignRepo.findById(id);
    if (!campaign) {
      throw new NotFoundError('Campaign');
    }
    return toCampaignDetailDTO(campaign);
  }

  async approve(
    id: string,
    adminId: string,
    ip: string,
    userAgent?: string,
  ): Promise<CampaignDTO> {
    const campaign = await this.campaignRepo.findById(id);
    if (!campaign) {
      throw new NotFoundError('Campaign');
    }
    if (campaign.status !== 'REVIEW') {
      throw new ValidationError([{ field: 'status', message: 'Campaign is not pending review' }]);
    }

    const updated = await this.campaignRepo.review(id, adminId, true);

    await this.auditLogRepo.create({
      userType: 'ADMIN',
      userId: adminId,
      action: 'CAMPAIGN_APPROVED',
      entityType: 'campaign',
      entityId: id,
      oldValues: { status: 'REVIEW' },
      newValues: { status: 'SCHEDULED' },
      ipAddress: ip,
      userAgent,
    });

    logger.info('Campaign approved', { campaignId: id, adminId });

    return toCampaignDTO({ ...updated, user: campaign.user });
  }

  async reject(
    id: string,
    adminId: string,
    reason: string,
    ip: string,
    userAgent?: string,
  ): Promise<CampaignDTO> {
    const campaign = await this.campaignRepo.findById(id);
    if (!campaign) {
      throw new NotFoundError('Campaign');
    }
    if (campaign.status !== 'REVIEW') {
      throw new ValidationError([{ field: 'status', message: 'Campaign is not pending review' }]);
    }

    const updated = await this.campaignRepo.review(id, adminId, false, reason);

    await this.auditLogRepo.create({
      userType: 'ADMIN',
      userId: adminId,
      action: 'CAMPAIGN_REJECTED',
      entityType: 'campaign',
      entityId: id,
      oldValues: { status: 'REVIEW' },
      newValues: { status: 'REJECTED', rejectionReason: reason },
      ipAddress: ip,
      userAgent,
    });

    logger.info('Campaign rejected', { campaignId: id, adminId, reason });

    return toCampaignDTO({ ...updated, user: campaign.user });
  }

  async updateStatus(
    id: string,
    status: string,
    adminId: string,
    ip: string,
    userAgent?: string,
  ): Promise<CampaignDTO> {
    const campaign = await this.campaignRepo.findById(id);
    if (!campaign) {
      throw new NotFoundError('Campaign');
    }

    const allowed = ['ACTIVE', 'PAUSED', 'SCHEDULED'];
    if (!allowed.includes(campaign.status)) {
      throw new ValidationError([{
        field: 'status',
        message: `Cannot change status from ${campaign.status}`,
      }]);
    }

    const updated = await this.campaignRepo.updateStatus(id, status as never);

    await this.auditLogRepo.create({
      userType: 'ADMIN',
      userId: adminId,
      action: `CAMPAIGN_${status.toUpperCase()}`,
      entityType: 'campaign',
      entityId: id,
      oldValues: { status: campaign.status },
      newValues: { status },
      ipAddress: ip,
      userAgent,
    });

    logger.info('Campaign status changed by admin', { campaignId: id, from: campaign.status, to: status, adminId });

    return toCampaignDTO({ ...updated, user: campaign.user });
  }

  async deleteCampaign(
    id: string,
    adminId: string,
    ip: string,
    userAgent?: string,
  ): Promise<void> {
    const campaign = await this.campaignRepo.findById(id);
    if (!campaign) {
      throw new NotFoundError('Campaign');
    }

    await this.campaignRepo.softDelete(id);

    await this.auditLogRepo.create({
      userType: 'ADMIN',
      userId: adminId,
      action: 'CAMPAIGN_DELETED',
      entityType: 'campaign',
      entityId: id,
      oldValues: { name: campaign.name, status: campaign.status },
      ipAddress: ip,
      userAgent,
    });

    logger.info('Campaign deleted by admin', { campaignId: id, adminId });
  }

  async bulkUpdateStatus(
    ids: readonly string[],
    status: string,
    adminId: string,
    ip: string,
    userAgent?: string,
  ): Promise<BulkActionResult> {
    const errors: { id: string; error: string }[] = [];
    let successful = 0;

    for (const id of ids) {
      try {
        await this.updateStatus(id, status, adminId, ip, userAgent);
        successful++;
      } catch (err) {
        errors.push({ id, error: (err as Error).message });
      }
    }

    return { successful, failed: errors.length, errors };
  }

  async bulkDelete(
    ids: readonly string[],
    adminId: string,
    ip: string,
    userAgent?: string,
  ): Promise<BulkActionResult> {
    const errors: { id: string; error: string }[] = [];
    let successful = 0;

    for (const id of ids) {
      try {
        await this.deleteCampaign(id, adminId, ip, userAgent);
        successful++;
      } catch (err) {
        errors.push({ id, error: (err as Error).message });
      }
    }

    return { successful, failed: errors.length, errors };
  }

  async getStatusCounts(): Promise<readonly CampaignStatusCount[]> {
    const counts = await this.campaignRepo.countByStatus();
    return counts.map((c) => ({ ...c, status: mapEnum(c.status) }));
  }
}
