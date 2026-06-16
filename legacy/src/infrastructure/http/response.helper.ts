import type { Response, Request } from 'express';

import type { ApiResponse, PaginatedResponse, PaginationMeta } from '../../shared/types/api-response.types';

export function success<T>(res: Response, data: T, message?: string, statusCode = 200): void {
  const response: ApiResponse<T> = {
    success: true,
    data,
    message,
    requestId: (res.req as Request).requestId,
  };
  res.status(statusCode).json(response);
}

export function created<T>(res: Response, data: T, message?: string): void {
  success(res, data, message, 201);
}

export function noContent(res: Response): void {
  res.status(204).send();
}

export function error(res: Response, statusCode: number, errorMessage: string, code?: string): void {
  const response: ApiResponse = {
    success: false,
    error: errorMessage,
    code,
    requestId: (res.req as Request).requestId,
  };
  res.status(statusCode).json(response);
}

export function paginated<T>(
  res: Response,
  data: ReadonlyArray<T>,
  meta: PaginationMeta,
  baseUrl: string,
): void {
  const buildUrl = (page: number) => `${baseUrl}?page=${page}&limit=${meta.perPage}`;

  const response: PaginatedResponse<T> = {
    data,
    meta,
    links: {
      first: buildUrl(1),
      last: buildUrl(meta.lastPage),
      prev: meta.currentPage > 1 ? buildUrl(meta.currentPage - 1) : null,
      next: meta.currentPage < meta.lastPage ? buildUrl(meta.currentPage + 1) : null,
    },
  };
  res.status(200).json(response);
}
