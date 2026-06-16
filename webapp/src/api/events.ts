import { apiClient } from './client';

export interface EventSearchResult {
  id: string;
  code: number;
  name: string;
  address: string | null;
  date: string;
  bannerImage: string | null;
}

interface BackendEventSearchResult {
  id: string;
  code: number;
  name: string;
  address: string | null;
  date: string;
  bannerImage: string | null;
}

export const eventsApi = {
  async search(query: string): Promise<EventSearchResult[]> {
    if (query.length < 2) return [];
    const results = await apiClient.get<BackendEventSearchResult[]>(
      `/v1/events/search?q=${encodeURIComponent(query)}`,
    );
    return results.map((e) => ({
      id: e.id,
      code: e.code,
      name: e.name,
      address: e.address,
      date: e.date,
      bannerImage: e.bannerImage,
    }));
  },
};
