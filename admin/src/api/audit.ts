import { apiClient } from './client';

export interface AuditEntry {
  id: string;
  actorId: string | null;
  actorName: string;
  action: string;
  targetType: string;
  targetId: string;
  targetName: string | null;
  detail: string | null;
  createdAt: string;
}

export const auditApi = {
  /** Recent admin governance actions, newest first. */
  getRecent: async (limit = 100, action?: string, targetType?: string): Promise<AuditEntry[]> => {
    return apiClient.post<AuditEntry[]>('/audit', { limit, action, targetType });
  },
};

export default auditApi;
