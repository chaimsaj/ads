const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export { API_URL };

export interface ApiError {
  status: number;
  message: string;
}

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

async function handleResponse<T>(response: Response): Promise<T> {
  if (response.status === 401) {
    window.dispatchEvent(new CustomEvent('auth:session-expired'));
    throw createApiError(401, 'Session expired. Please login again.');
  }

  // 204 No Content — nothing to parse
  if (response.status === 204) {
    return undefined as unknown as T;
  }

  const text = await response.text();
  if (!text) {
    if (!response.ok) {
      throw createApiError(response.status, 'An error occurred');
    }
    return undefined as unknown as T;
  }

  const json = JSON.parse(text);

  if (!response.ok) {
    throw createApiError(
      response.status,
      json.error || json.message || 'An error occurred',
    );
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
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    extractCsrfToken(response);
    return handleResponse<T>(response);
  },

  async post<T>(endpoint: string, body?: unknown): Promise<T> {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...getCsrfHeader('POST'),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    extractCsrfToken(response);
    return handleResponse<T>(response);
  },

  async put<T>(endpoint: string, body: unknown): Promise<T> {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'PUT',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...getCsrfHeader('PUT'),
      },
      body: JSON.stringify(body),
    });
    extractCsrfToken(response);
    return handleResponse<T>(response);
  },

  async patch<T>(endpoint: string, body?: unknown): Promise<T> {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'PATCH',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...getCsrfHeader('PATCH'),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    extractCsrfToken(response);
    return handleResponse<T>(response);
  },

  async delete<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'DELETE',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...getCsrfHeader('DELETE'),
      },
    });
    extractCsrfToken(response);
    return handleResponse<T>(response);
  },
};
