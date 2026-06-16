import type { PaginatedResponse } from '../types';

export interface BackendPaginatedResponse<T> {
  data: T[];
  meta: {
    currentPage: number;
    lastPage: number;
    perPage: number;
    total: number;
  };
  links: {
    first: string;
    last: string;
    prev: string | null;
    next: string | null;
  };
}

export function mapPaginatedResponse<T>(raw: BackendPaginatedResponse<T>): PaginatedResponse<T> {
  return {
    data: raw.data,
    pagination: {
      page: raw.meta.currentPage,
      limit: raw.meta.perPage,
      total: raw.meta.total,
      totalPages: raw.meta.lastPage,
    },
  };
}
