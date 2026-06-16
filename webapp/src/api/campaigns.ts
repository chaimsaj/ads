import { apiClient } from './client';

// =====================================================
// FRONTEND TYPES (used by pages)
// =====================================================

export interface PerformanceSummary {
  campaignId: string;
  campaignName: string;
  adFormat: string;
  status: string;
  startDate: string | null;
  endDate: string | null;
  locationName: string | null;
  budget: number;
  spend: number;
  impressions: number;
  clicks: number;
  applications: number;
  deposits: number;
  ctr: number;
  cpc: number;
  cpa: number;
  roi: number;
  conversionRate: number;
}

export interface DailyPerformance {
  date: string;
  impressions: number;
  clicks: number;
  applications: number;
  deposits: number;
  spend: number;
}

export interface PerformanceOverview {
  totalSpend: number;
  totalImpressions: number;
  totalClicks: number;
  totalApplications: number;
  totalDeposits: number;
  averageCtr: number;
  campaignCount: number;
}

export interface CampaignEstimate {
  estimatedImpressions: { low: number; high: number };
  estimatedClicks: { low: number; high: number };
  estimatedCtr: { low: number; high: number };
  estimatedCpc: { low: number; high: number };
}

export interface CampaignSummary {
  id: string;
  name: string;
  image: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  status: 'active' | 'paused' | 'scheduled' | 'completed' | 'review' | 'draft' | 'rejected';
  adFormat: 'Banner' | 'Interstitial' | 'Push';
  budget: number;
}

export interface CampaignDetail {
  id: string;
  name: string;
  status: string;
  adFormat: string;
  adType: string;
  boostType: string;
  adText: string;
  adLink: string;
  bannerImage: string | null;
  targeting: {
    address: string;
    radius: string;
    radiusKm: number;
  };
  startDate: string;
  endDate: string;
  createdAt: string;
  budget: number;
  spent: number;
  impressions: number;
  clicks: number;
  paymentMethod: string;
  transactionId: string;
}

export interface CampaignStats {
  active: number;
  paused: number;
  scheduled: number;
  completed: number;
  review: number;
  total: number;
}

export interface CreateCampaignRequest {
  name: string;
  adType: string;
  boostType?: string;
  adFormat: string;
  adText: string;
  link: string;
  bannerImage?: string;
  spotlightUserId?: string;
  eventId?: string;
  brandName?: string;
  brandTagline?: string;
  targeting: {
    address: string;
    radius: string;
    startDate: string;
    endDate: string;
    latitude?: number | null;
    longitude?: number | null;
  };
  audience?: {
    city?: string;
    industry?: string;
    goals?: string[];
    education?: string[];
    experience?: string[];
  };
  budget: number;
  paymentMethodId: string;
}

// =====================================================
// BACKEND SHAPES
// =====================================================

interface BackendCampaignDTO {
  id: string;
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

interface BackendCampaignDetailDTO extends BackendCampaignDTO {
  targeting: {
    locationName: string | null;
    latitude: number | null;
    longitude: number | null;
    radiusKm: number;
    ageMin: number;
    ageMax: number;
    gender: string;
    interests: string[];
    devices: string[];
    platforms: string[];
  } | null;
  dailyStats: Array<{
    date: string;
    impressions: number;
    clicks: number;
    conversions: number;
    spend: number;
  }>;
}

interface BackendPaginatedResponse<T> {
  data: T[];
  meta: {
    currentPage: number;
    lastPage: number;
    perPage: number;
    total: number;
  };
  links: {
    first: string;
    last: string;
    prev: string | null;
    next: string | null;
  };
}

interface BackendCampaignStatistics {
  totalCampaigns: number;
  activeCampaigns: number;
  totalBudget: number;
  totalSpent: number;
  totalImpressions: number;
  totalClicks: number;
  totalConversions: number;
  averageCtr: number;
}

// =====================================================
// MAPPERS: backend → frontend
// =====================================================

/** Convert an ISO date string or Date to YYYY-MM-DD for HTML date inputs */
function toDateString(value: unknown): string {
  if (!value) return '';
  const str = typeof value === 'string' ? value : String(value);
  // Already YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
  // ISO string like "2026-02-03T00:00:00.000Z" → "2026-02-03"
  const match = str.match(/^(\d{4}-\d{2}-\d{2})/);
  return match ? match[1] : str;
}

function mapCampaignSummary(dto: BackendCampaignDTO): CampaignSummary {
  const status = (dto.status || 'review').toLowerCase();
  return {
    id: dto.id,
    name: dto.name,
    image: dto.bannerImage || '',
    startDate: toDateString(dto.startDate),
    endDate: toDateString(dto.endDate),
    isActive: status === 'active',
    status: status as CampaignSummary['status'],
    adFormat: dto.adFormat as CampaignSummary['adFormat'],
    budget: Number(dto.budget) || 0,
  };
}

function mapCampaignDetail(dto: BackendCampaignDetailDTO): CampaignDetail {
  return {
    id: dto.id,
    name: dto.name,
    status: (dto.status || '').toLowerCase(),
    adFormat: dto.adFormat || '',
    adType: dto.adType || '',
    boostType: dto.boostType || '',
    adText: dto.adText || '',
    adLink: dto.destinationUrl || '',
    bannerImage: dto.bannerImage,
    targeting: {
      address: dto.targeting?.locationName || '',
      radius: dto.targeting ? String(dto.targeting.radiusKm) : '5',
      radiusKm: dto.targeting?.radiusKm ?? 5,
    },
    startDate: toDateString(dto.startDate),
    endDate: toDateString(dto.endDate),
    createdAt: toDateString(dto.createdAt),
    budget: Number(dto.budget) || 0,
    spent: Number(dto.spent) || 0,
    impressions: Number(dto.impressions) || 0,
    clicks: Number(dto.clicks) || 0,
    paymentMethod: '',
    transactionId: '',
  };
}

// =====================================================
// MAPPERS: frontend → backend
// =====================================================

function mapCreateRequest(data: CreateCampaignRequest): Record<string, unknown> {
  // Build interests array from audience demographic data
  const interests: string[] = [];
  if (data.audience) {
    if (data.audience.goals?.length) {
      interests.push(...data.audience.goals.filter((g) => g !== 'All'));
    }
    if (data.audience.education?.length) {
      interests.push(...data.audience.education.filter((e) => e !== 'All'));
    }
    if (data.audience.experience?.length) {
      interests.push(...data.audience.experience.filter((e) => e !== 'All'));
    }
    if (data.audience.industry) {
      interests.push(data.audience.industry);
    }
  }

  return {
    name: data.name,
    adType: (data.adType || '').toUpperCase(),
    boostType: data.boostType ? data.boostType.toUpperCase() : undefined,
    adFormat: (data.adFormat || '').toUpperCase(),
    adText: data.adText || undefined,
    destinationUrl: data.link
      ? (/^https?:\/\//i.test(data.link) ? data.link : `https://${data.link}`)
      : undefined,
    bannerImage: data.bannerImage || undefined,
    ...(data.spotlightUserId && { spotlightUserId: data.spotlightUserId }),
    ...(data.eventId && { eventId: data.eventId }),
    ...(data.brandName && { brandName: data.brandName }),
    ...(data.brandTagline && { brandTagline: data.brandTagline }),
    startDate: data.targeting.startDate,
    endDate: data.targeting.endDate,
    budget: data.budget,
    targeting: {
      locationName: data.audience?.city || data.targeting.address || undefined,
      radiusKm: Math.round(parseFloat(data.targeting.radius)) || 5,
      ...(data.targeting.latitude != null && { latitude: data.targeting.latitude }),
      ...(data.targeting.longitude != null && { longitude: data.targeting.longitude }),
      ...(interests.length > 0 && { interests }),
    },
  };
}

function mapUpdateRequest(data: Partial<CreateCampaignRequest>): Record<string, unknown> {
  const body: Record<string, unknown> = {};

  if (data.name !== undefined) body.name = data.name;
  if (data.adText !== undefined) body.adText = data.adText;
  if (data.link !== undefined) body.destinationUrl = data.link;
  if (data.bannerImage !== undefined) body.bannerImage = data.bannerImage;
  if (data.budget !== undefined) body.budget = data.budget;

  // Dates live at root level in the backend, not inside targeting
  if (data.targeting?.startDate) body.startDate = data.targeting.startDate;
  if (data.targeting?.endDate) body.endDate = data.targeting.endDate;

  // Targeting fields mapped to backend names
  if (data.targeting?.address !== undefined || data.targeting?.radius !== undefined) {
    body.targeting = {
      ...(data.targeting?.address !== undefined && { locationName: data.targeting.address }),
      ...(data.targeting?.radius !== undefined && { radiusKm: parseFloat(data.targeting.radius) || 5 }),
    };
  }

  return body;
}

// =====================================================
// API FUNCTIONS
// =====================================================

export const campaignsApi = {
  async getAll(params?: {
    status?: string;
    adFormat?: string;
    search?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<CampaignSummary[]> {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          // Backend expects uppercase enum values for status/adFormat filters
          if ((key === 'status' || key === 'adFormat') && typeof value === 'string') {
            searchParams.append(key, value.toUpperCase());
          } else {
            searchParams.append(key, String(value));
          }
        }
      });
    }
    // Request a large page to get all campaigns for client-side filtering
    if (!params?.limit) {
      searchParams.set('limit', '100');
    }
    const query = searchParams.toString();
    const raw = await apiClient.get<BackendPaginatedResponse<BackendCampaignDTO>>(
      `/v1/campaigns${query ? `?${query}` : ''}`,
    );
    return raw.data.map(mapCampaignSummary);
  },

  async getById(id: string): Promise<CampaignDetail> {
    const raw = await apiClient.get<BackendCampaignDetailDTO>(`/v1/campaigns/${id}`);
    if (!raw || typeof raw !== 'object' || !raw.id) {
      throw new Error('Campaign not found');
    }
    return mapCampaignDetail(raw);
  },

  async getStatistics(): Promise<CampaignStats> {
    const raw = await apiClient.get<BackendCampaignStatistics>('/v1/campaigns/statistics');
    return {
      active: raw.activeCampaigns ?? 0,
      paused: 0,
      scheduled: 0,
      completed: 0,
      review: 0,
      total: raw.totalCampaigns ?? 0,
    };
  },

  async create(data: CreateCampaignRequest): Promise<CampaignDetail> {
    const body = mapCreateRequest(data);
    const raw = await apiClient.post<BackendCampaignDetailDTO>('/v1/campaigns', body);
    return mapCampaignDetail(raw);
  },

  async update(id: string, data: Partial<CreateCampaignRequest>): Promise<CampaignDetail> {
    const body = mapUpdateRequest(data);
    const raw = await apiClient.put<BackendCampaignDetailDTO>(`/v1/campaigns/${id}`, body);
    return mapCampaignDetail(raw);
  },

  async updateStatus(id: string, status: string): Promise<void> {
    return apiClient.patch(`/v1/campaigns/${id}/status`, {
      status: status.toUpperCase(),
    });
  },

  async duplicate(id: string): Promise<CampaignDetail> {
    const raw = await apiClient.post<BackendCampaignDetailDTO>(`/v1/campaigns/${id}/duplicate`);
    return mapCampaignDetail(raw);
  },

  async getEstimate(params: {
    budget: number;
    adFormat: string;
    durationDays: number;
    locationName?: string;
  }): Promise<CampaignEstimate> {
    return apiClient.post<CampaignEstimate>('/v1/campaigns/estimate', params);
  },

  async delete(id: string): Promise<void> {
    return apiClient.delete(`/v1/campaigns/${id}`);
  },

  async getPerformance(id: string): Promise<PerformanceSummary> {
    return apiClient.get<PerformanceSummary>(`/v1/campaigns/${id}/performance`);
  },

  async getDailyPerformance(id: string, days?: number): Promise<DailyPerformance[]> {
    const params = days ? `?days=${days}` : '';
    return apiClient.get<DailyPerformance[]>(`/v1/campaigns/${id}/performance/daily${params}`);
  },

  async getPerformanceOverview(): Promise<PerformanceOverview> {
    return apiClient.get<PerformanceOverview>('/v1/campaigns/performance/overview');
  },

  async exportCsv(): Promise<Blob> {
    const response = await fetch(
      `${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/v1/campaigns/export`,
      {
        credentials: 'include',
      }
    );
    if (!response.ok) {
      throw new Error('Export failed');
    }
    return response.blob();
  },
};
