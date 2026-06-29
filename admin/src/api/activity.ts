import { apiClient } from './client';
import type { Activity } from '../types';

interface BackendAdEvent {
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

const stateLabel: Record<BackendAdEvent['state'], string> = {
  served: 'Ad served',
  impressed: 'Impression',
  clicked: 'Click',
  converted: 'Conversion',
};

function mapEvent(e: BackendAdEvent): Activity {
  const campaign = e.campaignName || `Campaign ${e.campaignId.slice(-6)}`;
  return {
    id: e.servedAdId,
    type: e.state,
    description: `${stateLabel[e.state]} — ${campaign} · ${e.format}`,
    timestamp: e.servedAt,
  };
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
  /** Recent ad-delivery events across the platform (admin), newest first. */
  getRecent: async (limit = 12, campaignId?: string): Promise<Activity[]> => {
    const events = await apiClient.post<BackendAdEvent[]>('/activity', { limit, campaignId });
    return events.map(mapEvent);
  },

  /** Where ads are shown: counts grouped by platform, format, and location. */
  getBreakdown: async (campaignId?: string): Promise<AdBreakdown> => {
    return apiClient.post<AdBreakdown>('/activity/breakdown', { campaignId });
  },
};

export default activityApi;
