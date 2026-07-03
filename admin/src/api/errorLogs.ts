import { apiClient } from './client';

export interface ErrorLogItem {
  id: string;
  source: string;
  message: string;
  level: string;
  exceptionType: string | null;
  stackTrace: string | null;
  correlationId: string | null;
  occurredAt: string;
}

export interface ErrorLogListResponse {
  total: number;
  items: ErrorLogItem[];
}

export const errorLogsApi = {
  /** Recent persisted server-side errors, newest first. Optional level/source filters. */
  getRecent: async (limit = 100, level?: string, source?: string): Promise<ErrorLogListResponse> => {
    try {
      const data = await apiClient.post<ErrorLogListResponse>('/error-logs', { limit, level, source });
      return data && Array.isArray(data.items) ? data : { total: 0, items: [] };
    } catch {
      return { total: 0, items: [] };
    }
  },
};

export default errorLogsApi;
