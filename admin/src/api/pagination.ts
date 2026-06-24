import type { PaginatedResponse } from '../types';

export interface BackendPaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export function mapPaginatedResponse<T>(raw: BackendPaginatedResponse<T>): PaginatedResponse<T> {
  return {
    data: raw.data,
    pagination: {
      page: raw.pagination.page,
      limit: raw.pagination.limit,
      total: raw.pagination.total,
      totalPages: raw.pagination.totalPages,
    },
  };
}
