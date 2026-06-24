import { apiClient, setTokens } from './client';
import type { AdminUser } from '../types';

interface BackendAdminProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  twoFactorEnabled: boolean;
  permissions: string[] | null;
}

interface BackendAuthResponse {
  user: BackendAdminProfile;
  accessToken: string;
  refreshToken: string;
  accessExpiresAtUtc: string;
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
  login: async (email: string, password: string): Promise<AdminUser> => {
    const res = await apiClient.post<BackendAuthResponse>('/auth/login', { email, password });
    setTokens(res.accessToken, res.refreshToken);
    return mapAdminProfile(res.user);
  },

  logout: async (): Promise<void> => {
    await apiClient.post('/auth/logout');
  },

  me: async (): Promise<AdminUser> => {
    const raw = await apiClient.post<BackendAdminProfile>('/auth/profile');
    return mapAdminProfile(raw);
  },
};
