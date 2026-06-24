import { apiClient } from './client';

// =====================================================
// FRONTEND TYPES
// =====================================================

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  companyName?: string;
  phone?: string;
  avatarUrl?: string;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

// =====================================================
// BACKEND SHAPES
// =====================================================

export interface BackendUserProfileDTO {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
  avatar: string | null;
  status: string;
  role: string;
  emailVerified: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}

// =====================================================
// MAPPERS
// =====================================================

export function mapProfileResponse(dto: BackendUserProfileDTO): UserProfile {
  return {
    id: dto.id,
    name: dto.name || '',
    email: dto.email || '',
    companyName: dto.company || undefined,
    phone: dto.phone || undefined,
    avatarUrl: dto.avatar || undefined,
    emailVerified: dto.emailVerified ?? false,
    createdAt: dto.createdAt || '',
    updatedAt: dto.createdAt || '',
  };
}

function mapUpdateRequest(data: {
  name?: string;
  companyName?: string;
  phone?: string;
}): Record<string, unknown> {
  const body: Record<string, unknown> = {};
  if (data.name !== undefined) body.name = data.name;
  if (data.companyName !== undefined) body.company = data.companyName;
  if (data.phone !== undefined) body.phone = data.phone || null;
  return body;
}

// =====================================================
// API FUNCTIONS
// =====================================================

export const userApi = {
  async getProfile(): Promise<UserProfile> {
    const raw = await apiClient.post<BackendUserProfileDTO>('/user/profile');
    return mapProfileResponse(raw);
  },

  async updateProfile(data: {
    name?: string;
    companyName?: string;
    phone?: string;
  }): Promise<UserProfile> {
    const body = mapUpdateRequest(data);
    const raw = await apiClient.post<BackendUserProfileDTO>('/user/profile/update', body);
    return mapProfileResponse(raw);
  },

  async changePassword(data: { currentPassword: string; newPassword: string }): Promise<void> {
    await apiClient.post('/user/password/change', data);
  },

  async deleteAccount(): Promise<void> {
    await apiClient.post('/user/account/delete');
  },

  async getNotificationSettings(): Promise<Record<string, boolean>> {
    return apiClient.post('/user/notifications/settings/get');
  },

  async updateNotificationSettings(data: Record<string, boolean>): Promise<void> {
    await apiClient.post('/user/notifications/settings/update', { settings: data });
  },
};
