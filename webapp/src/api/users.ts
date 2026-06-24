import { apiClient } from './client';

export interface UserSearchResult {
  id: string;
  name: string;
  company: string | null;
  avatar: string | null;
}

interface BackendUserSearchResult {
  id: string;
  name: string;
  company: string | null;
  avatar: string | null;
}

export const usersApi = {
  async search(query: string): Promise<UserSearchResult[]> {
    if (query.length < 2) return [];
    const results = await apiClient.post<BackendUserSearchResult[]>('/users/search', { q: query });
    return results.map((u) => ({
      id: u.id,
      name: u.name,
      company: u.company,
      avatar: u.avatar,
    }));
  },
};
