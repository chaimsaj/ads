import { apiClient, API_URL } from './client';
import type { AdminUser, LoginResponse } from '../types';

interface BackendAdminProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  twoFactorEnabled: boolean;
  permissions: string[] | null;
}

function mapAdminProfile(raw: BackendAdminProfile): AdminUser {
  return {
    id: raw.id,
    email: raw.email,
    name: raw.name,
    role: raw.role as AdminUser['role'],
    permissions: raw.permissions ?? [],
    createdAt: '',
    lastLogin: undefined,
  };
}

export const authApi = {
  login: async (email: string, password: string, totpCode?: string): Promise<LoginResponse> => {
    const body: Record<string, string> = { email, password };
    if (totpCode) {
      body.twoFactorCode = totpCode;
    }
    return apiClient.post<LoginResponse>('/admin/v1/auth/login', body);
  },

  logout: async (): Promise<void> => {
    await apiClient.post('/admin/v1/auth/logout');
  },

  me: async (): Promise<AdminUser> => {
    const raw = await apiClient.get<BackendAdminProfile>('/admin/v1/auth/profile');
    return mapAdminProfile(raw);
  },

  refresh: async (): Promise<void> => {
    const res = await fetch(`${API_URL}/admin/v1/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) {
      throw new Error('Token refresh failed');
    }
  },
};
