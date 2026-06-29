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

export const activityApi = {
  /** Recent ad-delivery events for the signed-in advertiser, optionally scoped to one campaign. */
  getRecent: async (campaignId?: string, limit = 20): Promise<AdEvent[]> => {
    return apiClient.post<AdEvent[]>('/activity', { campaignId, limit });
  },
};

export default activityApi;
