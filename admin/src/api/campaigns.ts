import { apiClient } from './client';
import { mapPaginatedResponse, type BackendPaginatedResponse } from './pagination';
import type { Campaign, PaginatedResponse, PaginationParams } from '../types';

// =====================================================
// BACKEND DTO
// =====================================================

interface BackendCampaignDTO {
  id: string;
  userId: string;
  userName?: string;
  name: string;
  adType: string;
  boostType: string;
  adFormat: string;
  status: string;
  adText: string | null;
  bannerImage: string | null;
  destinationUrl: string | null;
  startDate: string;
  endDate: string;
  budget: number;
  spent: number;
  impressions: number;
  clicks: number;
  conversions: number;
  ctr: number;
  createdAt: string;
}

// =====================================================
// MAPPERS
// =====================================================

function mapCampaign(dto: BackendCampaignDTO): Campaign {
  return {
    id: dto.id,
    name: dto.name,
    userId: dto.userId,
    userName: dto.userName || `User ${dto.userId}`,
    status: (dto.status || 'review').toLowerCase() as Campaign['status'],
    adType: (dto.adType || '').toLowerCase() as Campaign['adType'],
    adFormat: (dto.adFormat || '').toLowerCase() as Campaign['adFormat'],
    boostType: (dto.boostType || 'standard').toLowerCase() as Campaign['boostType'],
    budget: Number(dto.budget) || 0,
    spent: Number(dto.spent) || 0,
    impressions: Number(dto.impressions) || 0,
    clicks: Number(dto.clicks) || 0,
    ctr: Number(dto.ctr) || 0,
    startDate: dto.startDate || '',
    endDate: dto.endDate || '',
    createdAt: dto.createdAt || '',
  };
}

function mapPaginatedCampaigns(
  raw: BackendPaginatedResponse<BackendCampaignDTO>,
): PaginatedResponse<Campaign> {
  const mapped = mapPaginatedResponse(raw);
  return {
    ...mapped,
    data: (raw.data || []).map(mapCampaign),
  };
}

// =====================================================
// FILTERS
// =====================================================

interface CampaignFilters extends PaginationParams {
  status?: Campaign['status'];
  adFormat?: Campaign['adFormat'];
  userId?: string;
}

function buildListBody(params: CampaignFilters): Record<string, unknown> {
  const body: Record<string, unknown> = {};
  if (params.page) body.page = params.page;
  if (params.limit) body.limit = params.limit;
  if (params.search) body.search = params.search;
  if (params.sortBy) body.sortBy = params.sortBy;
  if (params.sortOrder) body.sortOrder = params.sortOrder;
  if (params.status) body.status = params.status.toUpperCase();
  if (params.adFormat) body.adFormat = params.adFormat.toUpperCase();
  if (params.userId) body.userId = params.userId;
  return body;
}

// =====================================================
// API
// =====================================================

export const campaignsApi = {
  getAll: async (params: CampaignFilters = {}): Promise<PaginatedResponse<Campaign>> => {
    const raw = await apiClient.post<BackendPaginatedResponse<BackendCampaignDTO>>(
      '/campaigns/list',
      buildListBody(params),
    );
    return mapPaginatedCampaigns(raw);
  },

  getById: async (id: string): Promise<Campaign> => {
    const raw = await apiClient.post<BackendCampaignDTO>('/campaigns/get', { id });
    return mapCampaign(raw);
  },

  updateStatus: async (id: string, status: string): Promise<Campaign> => {
    const raw = await apiClient.post<BackendCampaignDTO>('/campaigns/status', {
      id,
      status: status.toUpperCase(),
    });
    return mapCampaign(raw);
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.post('/campaigns/delete', { id });
  },

  approve: async (id: string): Promise<Campaign> => {
    const raw = await apiClient.post<BackendCampaignDTO>('/campaigns/approve', { id });
    return mapCampaign(raw);
  },

  reject: async (id: string, reason?: string): Promise<Campaign> => {
    const raw = await apiClient.post<BackendCampaignDTO>('/campaigns/reject', {
      id,
      reason: reason || 'Rejected by admin',
    });
    return mapCampaign(raw);
  },

  bulkAction: async (
    action: 'activate' | 'pause' | 'delete',
    ids: string[],
  ): Promise<{ success: string[]; failed: string[] }> => {
    if (action === 'delete') {
      const raw = await apiClient.post<{ successful: number; failed: number; errors: Array<{ id: string; error: string }> }>(
        '/campaigns/bulk-delete',
        { ids },
      );
      const failedIds = (raw.errors || []).map((e) => e.id);
      const successIds = ids.filter((id) => !failedIds.includes(id));
      return { success: successIds, failed: failedIds };
    }

    const statusMap: Record<string, string> = {
      activate: 'ACTIVE',
      pause: 'PAUSED',
    };
    const raw = await apiClient.post<{ successful: number; failed: number; errors: Array<{ id: string; error: string }> }>(
      '/campaigns/bulk-status',
      { ids, status: statusMap[action] },
    );
    const failedIds = (raw.errors || []).map((e) => e.id);
    const successIds = ids.filter((id) => !failedIds.includes(id));
    return { success: successIds, failed: failedIds };
  },
};
