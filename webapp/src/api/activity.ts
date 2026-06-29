import { apiClient } from './client';

export interface AdEvent {
  servedAdId: string;
  campaignId: string;
  campaignName?: string | null;
  deviceId?: string | null;
  format: string;
  state: 'served' | 'impressed' | 'clicked' | 'converted';
  lat?: number | null;
  lng?: number | null;
  servedAt: string;
}

export interface BreakdownBucket {
  key: string;
  served: number;
  impressed: number;
  clicked: number;
  converted: number;
}

export interface AdBreakdown {
  byPlatform: BreakdownBucket[];
  byFormat: BreakdownBucket[];
  byLocation: BreakdownBucket[];
}

export const activityApi = {
  /** Recent ad-delivery events for the signed-in advertiser, optionally scoped to one campaign. */
  getRecent: async (campaignId?: string, limit = 20): Promise<AdEvent[]> => {
    return apiClient.post<AdEvent[]>('/activity', { campaignId, limit });
  },

  /** Where this advertiser's ads are shown: counts by platform, format, and location. */
  getBreakdown: async (campaignId?: string): Promise<AdBreakdown> => {
    return apiClient.post<AdBreakdown>('/activity/breakdown', { campaignId });
  },
};

export default activityApi;
