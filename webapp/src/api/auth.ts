import { apiClient, setTokens, clearTokens } from './client';
import { mapProfileResponse, type BackendUserProfileDTO } from './user';
import type { User } from '../types/api';

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

interface BackendAuthResponse {
  user: BackendUserProfileDTO;
  accessToken: string;
  refreshToken: string;
  accessExpiresAtUtc: string;
}

function mapUserFromBackend(dto: BackendUserProfileDTO): User {
  const mapped = mapProfileResponse(dto);
  return {
    id: mapped.id,
    email: mapped.email,
    name: mapped.name,
    companyName: mapped.companyName,
    phone: mapped.phone,
    avatarUrl: mapped.avatarUrl,
    emailVerified: mapped.emailVerified,
    createdAt: mapped.createdAt,
    updatedAt: mapped.updatedAt,
  };
}

export const authApi = {
  async login(email: string, password: string): Promise<{ user: User }> {
    const raw = await apiClient.post<BackendAuthResponse>('/auth/login', { email, password });
    setTokens(raw.accessToken, raw.refreshToken);
    return { user: mapUserFromBackend(raw.user) };
  },

  async register(data: RegisterRequest): Promise<{ user: User }> {
    const raw = await apiClient.post<BackendAuthResponse>('/auth/register', data);
    setTokens(raw.accessToken, raw.refreshToken);
    return { user: mapUserFromBackend(raw.user) };
  },

  async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout');
    } finally {
      clearTokens();
    }
  },

  async getProfile(): Promise<User> {
    const raw = await apiClient.post<BackendUserProfileDTO>('/user/profile');
    return mapUserFromBackend(raw);
  },
};
