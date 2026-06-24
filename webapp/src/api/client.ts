import type { ApiError } from '../types/api';

const API_BASE = `${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/v1/ads-advertiser`;

const ACCESS_KEY = 'ads_advertiser_access';
const REFRESH_KEY = 'ads_advertiser_refresh';

export { API_BASE };

export function createApiError(status: number, message: string): ApiError {
  return { status, message };
}

export function isApiError(error: unknown): error is ApiError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'status' in error &&
    'message' in error
  );
}

export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_KEY);
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_KEY);
}

export function setTokens(access: string, refresh: string): void {
  localStorage.setItem(ACCESS_KEY, access);
  localStorage.setItem(REFRESH_KEY, refresh);
}

export function clearTokens(): void {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

let isRefreshing = false;

async function tryRefresh(): Promise<boolean> {
  const refresh = getRefreshToken();
  if (!refresh || isRefreshing) return false;
  isRefreshing = true;
  try {
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: refresh }),
    });
    if (!res.ok) return false;
    const json = await res.json();
    if (json.accessToken && json.refreshToken) {
      setTokens(json.accessToken, json.refreshToken);
      return true;
    }
    return false;
  } catch {
    return false;
  } finally {
    isRefreshing = false;
  }
}

function authHeaders(extra: Record<string, string> = {}): Record<string, string> {
  const token = getAccessToken();
  return token ? { ...extra, Authorization: `Bearer ${token}` } : extra;
}

async function handleResponse<T>(response: Response, retryFn?: () => Promise<Response>): Promise<T> {
  if (response.status === 401 && retryFn && getRefreshToken()) {
    if (await tryRefresh()) {
      return handleResponse<T>(await retryFn());
    }
    clearTokens();
    window.dispatchEvent(new CustomEvent('auth:session-expired'));
    throw createApiError(401, 'Session expired. Please login again.');
  }

  if (response.status === 204 || response.headers.get('content-length') === '0') {
    if (!response.ok) {
      throw createApiError(response.status, 'An error occurred');
    }
    return undefined as T;
  }

  const json = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = json.detail || json.title || json.message || json.error || 'An error occurred';
    throw createApiError(response.status, message);
  }

  return json as T;
}

export const apiClient = {
  /** POST a JSON-RPC action. `path` is relative to the surface base, e.g. '/campaigns/list'. */
  async post<T>(path: string, body?: unknown): Promise<T> {
    const doFetch = () =>
      fetch(`${API_BASE}${path}`, {
        method: 'POST',
        headers: authHeaders({ 'Content-Type': 'application/json' }),
        body: body !== undefined ? JSON.stringify(body) : '{}',
      });
    return handleResponse<T>(await doFetch(), doFetch);
  },

  /** POST multipart/form-data (banner upload). The browser sets the Content-Type boundary. */
  async postForm<T>(path: string, form: FormData): Promise<T> {
    const doFetch = () =>
      fetch(`${API_BASE}${path}`, { method: 'POST', headers: authHeaders(), body: form });
    return handleResponse<T>(await doFetch(), doFetch);
  },

  /** POST an action that returns a binary file (e.g. CSV export). Returns the response Blob. */
  async postBlob(path: string, body?: unknown): Promise<Blob> {
    const doFetch = () =>
      fetch(`${API_BASE}${path}`, {
        method: 'POST',
        headers: authHeaders({ 'Content-Type': 'application/json' }),
        body: body !== undefined ? JSON.stringify(body) : '{}',
      });
    let response = await doFetch();
    if (response.status === 401 && getRefreshToken()) {
      if (await tryRefresh()) {
        response = await doFetch();
      } else {
        clearTokens();
        window.dispatchEvent(new CustomEvent('auth:session-expired'));
        throw createApiError(401, 'Session expired. Please login again.');
      }
    }
    if (!response.ok) {
      throw createApiError(response.status, 'An error occurred');
    }
    return response.blob();
  },

  /** Absolute URL for an <img src> media reference (served anonymously). */
  mediaUrl(idOrUrl: string): string {
    if (!idOrUrl) return '';
    if (idOrUrl.startsWith('http') || idOrUrl.startsWith(API_BASE)) return idOrUrl;
    return idOrUrl.startsWith('/') ? `${import.meta.env.VITE_API_URL || ''}${idOrUrl}` : idOrUrl;
  },
};

export default apiClient;
