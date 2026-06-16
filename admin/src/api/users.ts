import { apiClient } from './client';
import { mapPaginatedResponse, type BackendPaginatedResponse } from './pagination';
import type { User, PaginatedResponse, PaginationParams } from '../types';

// =====================================================
// BACKEND DTO
// =====================================================

interface BackendUserDTO {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
  avatar: string | null;
  status: string;
  role: string;
  emailVerified: boolean;
  campaignsCount: number;
  totalSpent: number;
  lastLoginAt: string | null;
  createdAt: string;
}

// =====================================================
// MAPPERS
// =====================================================

function mapUser(dto: BackendUserDTO): User {
  return {
    id: dto.id,
    name: dto.name,
    email: dto.email,
    role: (dto.role || 'user').toLowerCase() as User['role'],
    status: (dto.status || 'active').toLowerCase() as User['status'],
    avatar: dto.avatar ?? undefined,
    createdAt: dto.createdAt || '',
    lastLogin: dto.lastLoginAt ?? undefined,
    totalCampaigns: Number(dto.campaignsCount) || 0,
    totalSpend: Number(dto.totalSpent) || 0,
  };
}

function mapPaginatedUsers(
  raw: BackendPaginatedResponse<BackendUserDTO>,
): PaginatedResponse<User> {
  const mapped = mapPaginatedResponse(raw);
  return {
    ...mapped,
    data: (raw.data || []).map(mapUser),
  };
}

// =====================================================
// FILTERS
// =====================================================

interface UserFilters extends PaginationParams {
  status?: User['status'];
  role?: User['role'];
}

function buildQueryString(params: UserFilters): string {
  const query = new URLSearchParams();
  if (params.page) query.set('page', String(params.page));
  if (params.limit) query.set('limit', String(params.limit));
  if (params.search) query.set('search', params.search);
  if (params.sortBy) query.set('sortBy', params.sortBy);
  if (params.sortOrder) query.set('sortOrder', params.sortOrder);
  if (params.status) query.set('status', params.status.toUpperCase());
  if (params.role) query.set('role', params.role.toUpperCase());
  return query.toString();
}

// =====================================================
// API
// =====================================================

export const usersApi = {
  getAll: async (params: UserFilters = {}): Promise<PaginatedResponse<User>> => {
    const query = buildQueryString(params);
    const raw = await apiClient.get<BackendPaginatedResponse<BackendUserDTO>>(
      `/admin/v1/users?${query}`,
    );
    return mapPaginatedUsers(raw);
  },

  getById: async (id: string): Promise<User> => {
    const raw = await apiClient.get<BackendUserDTO>(`/admin/v1/users/${id}`);
    return mapUser(raw);
  },

  update: async (id: string, data: Partial<User>): Promise<User> => {
    const raw = await apiClient.put<BackendUserDTO>(`/admin/v1/users/${id}`, data);
    return mapUser(raw);
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/admin/v1/users/${id}`);
  },

  updateStatus: async (id: string, status: User['status']): Promise<User> => {
    const raw = await apiClient.patch<BackendUserDTO>(
      `/admin/v1/users/${id}/status`,
      { status: status.toUpperCase() },
    );
    return mapUser(raw);
  },

  bulkAction: async (
    action: 'activate' | 'suspend' | 'delete',
    ids: string[],
  ): Promise<{ success: string[]; failed: string[] }> => {
    const raw = await apiClient.post<{
      successful: number;
      failed: number;
      errors: Array<{ id: string; error: string }>;
    }>('/admin/v1/users/bulk', { action, ids });

    const failedIds = (raw.errors || []).map((e) => e.id);
    const successIds = ids.filter((id) => !failedIds.includes(id));
    return { success: successIds, failed: failedIds };
  },
};
