import { Parser } from 'json2csv';

import { mapEnum } from '../../../infrastructure/utils/enum-mapper';
import { createLogger } from '../../../infrastructure/logging/logger';
import type { ICampaignRepository } from '../interfaces/campaign-repository.interface';
import type { CampaignFilters } from '../types/campaign.types';

const logger = createLogger('campaign-export-service');

const CSV_FIELDS = [
  'ID',
  'User ID',
  'User Name',
  'Name',
  'Ad Type',
  'Boost Type',
  'Ad Format',
  'Status',
  'Start Date',
  'End Date',
  'Budget',
  'Spent',
  'Impressions',
  'Clicks',
  'Conversions',
  'CTR (%)',
  'Created At',
] as const;

export class CampaignExportService {
  constructor(private readonly campaignRepo: ICampaignRepository) {}

  async exportCSV(filters: CampaignFilters): Promise<string> {
    const result = await this.campaignRepo.findMany(filters, {
      page: 1,
      limit: 10000,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    });

    const rows = result.data.map((campaign) => {
      const impressions = Number(campaign.impressions);
      const clicks = Number(campaign.clicks);
      const ctr = impressions > 0 ? ((clicks / impressions) * 100).toFixed(2) : '0.00';

      return {
        ID: campaign.id,
        'User ID': campaign.userId,
        'User Name': campaign.user.name,
        Name: campaign.name,
        'Ad Type': mapEnum(campaign.adType),
        'Boost Type': mapEnum(campaign.boostType),
        'Ad Format': mapEnum(campaign.adFormat),
        Status: mapEnum(campaign.status),
        'Start Date': campaign.startDate.toISOString().split('T')[0],
        'End Date': campaign.endDate.toISOString().split('T')[0],
        Budget: Number(campaign.budget).toFixed(2),
        Spent: Number(campaign.spent).toFixed(2),
        Impressions: impressions,
        Clicks: clicks,
        Conversions: campaign.conversions,
        'CTR (%)': ctr,
        'Created At': campaign.createdAt.toISOString(),
      };
    });

    const parser = new Parser({ fields: [...CSV_FIELDS] });
    const csv = parser.parse(rows);

    logger.info('Campaigns exported to CSV', { count: rows.length });

    return csv;
  }

  async exportUserCSV(userId: string, filters: CampaignFilters): Promise<string> {
    return this.exportCSV({ ...filters, userId });
  }
}
