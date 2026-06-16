import { apiClient, API_URL } from './client';
import { mapProfileResponse, type BackendUserProfileDTO } from './user';
import type { User } from '../types/api';

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

interface BackendLoginResponse {
  user: BackendUserProfileDTO;
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
    const raw = await apiClient.post<BackendLoginResponse>('/v1/auth/login', { email, password });
    return { user: mapUserFromBackend(raw.user) };
  },

  async register(data: RegisterRequest): Promise<{ user: User }> {
    const raw = await apiClient.post<BackendLoginResponse>('/v1/auth/register', data);
    return { user: mapUserFromBackend(raw.user) };
  },

  async logout(): Promise<void> {
    await apiClient.post('/v1/auth/logout');
  },

  async getProfile(): Promise<User> {
    const raw = await apiClient.get<BackendUserProfileDTO>('/v1/user/profile');
    return mapUserFromBackend(raw);
  },

  async refresh(): Promise<void> {
    const res = await fetch(`${API_URL}/v1/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) {
      throw new Error('Token refresh failed');
    }
  },
};
