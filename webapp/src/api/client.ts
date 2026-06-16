import type { ApiError } from '../types/api';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export { API_URL };

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

let csrfToken = '';
let isAuthenticated = false;
let isRefreshing = false;

export function setClientAuthenticated(value: boolean): void {
  isAuthenticated = value;
}

function extractCsrfToken(response: Response): void {
  const token = response.headers.get('x-csrf-token');
  if (token) {
    csrfToken = token;
  }
}

function getCsrfHeader(method: string): Record<string, string> {
  const mutating = ['POST', 'PUT', 'PATCH', 'DELETE'];
  if (mutating.includes(method.toUpperCase())) {
    return csrfToken ? { 'x-csrf-token': csrfToken } : {};
  }
  return {};
}

async function tryRefreshToken(): Promise<boolean> {
  if (isRefreshing || !isAuthenticated) return false;
  isRefreshing = true;
  try {
    const res = await fetch(`${API_URL}/v1/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...getCsrfHeader('POST'),
      },
    });
    extractCsrfToken(res);
    return res.ok;
  } catch {
    return false;
  } finally {
    isRefreshing = false;
  }
}

async function handleResponse<T>(response: Response, retryFn?: () => Promise<Response>): Promise<T> {
  if (response.status === 401 && isAuthenticated) {
    if (retryFn) {
      const refreshed = await tryRefreshToken();
      if (refreshed) {
        const retryResponse = await retryFn();
        extractCsrfToken(retryResponse);
        return handleResponse<T>(retryResponse);
      }
    }
    isAuthenticated = false;
    window.dispatchEvent(new CustomEvent('auth:session-expired'));
    throw createApiError(401, 'Session expired. Please login again.');
  }

  // Handle 204 No Content (delete, password change, etc.)
  if (response.status === 204 || response.headers.get('content-length') === '0') {
    if (!response.ok) {
      throw createApiError(response.status, 'An error occurred');
    }
    return undefined as T;
  }

  const json = await response.json();

  if (!response.ok) {
    let message = json.error || json.message || 'An error occurred';
    if (json.details && Array.isArray(json.details)) {
      const fieldErrors = json.details
        .map((d: { field?: string; message?: string }) => d.field ? `${d.field}: ${d.message}` : d.message)
        .filter(Boolean)
        .join('; ');
      if (fieldErrors) message += ` (${fieldErrors})`;
    }
    throw createApiError(response.status, message);
  }

  // success() wrapped response: { success: true, data: T }
  if ('success' in json && json.data !== undefined) {
    return json.data as T;
  }

  // paginated() or other direct responses (no success wrapper)
  return json as T;
}

export const apiClient = {
  async get<T>(endpoint: string): Promise<T> {
    const doFetch = () => fetch(`${API_URL}${endpoint}`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    const response = await doFetch();
    extractCsrfToken(response);
    return handleResponse<T>(response, doFetch);
  },

  async post<T>(endpoint: string, body?: unknown): Promise<T> {
    const doFetch = () => fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...getCsrfHeader('POST'),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    const response = await doFetch();
    extractCsrfToken(response);
    return handleResponse<T>(response, doFetch);
  },

  async put<T>(endpoint: string, body: unknown): Promise<T> {
    const doFetch = () => fetch(`${API_URL}${endpoint}`, {
      method: 'PUT',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...getCsrfHeader('PUT'),
      },
      body: JSON.stringify(body),
    });
    const response = await doFetch();
    extractCsrfToken(response);
    return handleResponse<T>(response, doFetch);
  },

  async patch<T>(endpoint: string, body?: unknown): Promise<T> {
    const doFetch = () => fetch(`${API_URL}${endpoint}`, {
      method: 'PATCH',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...getCsrfHeader('PATCH'),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    const response = await doFetch();
    extractCsrfToken(response);
    return handleResponse<T>(response, doFetch);
  },

  async delete<T>(endpoint: string): Promise<T> {
    const doFetch = () => fetch(`${API_URL}${endpoint}`, {
      method: 'DELETE',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...getCsrfHeader('DELETE'),
      },
    });
    const response = await doFetch();
    extractCsrfToken(response);
    return handleResponse<T>(response, doFetch);
  },
};

export default apiClient;
