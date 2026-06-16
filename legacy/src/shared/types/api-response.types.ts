export interface ApiResponse<T = unknown> {
  readonly success: boolean;
  readonly data?: T;
  readonly message?: string;
  readonly error?: string;
  readonly code?: string;
  readonly details?: ReadonlyArray<{ field: string; message: string }>;
  readonly requestId?: string;
}

export interface PaginatedResponse<T> {
  readonly data: ReadonlyArray<T>;
  readonly meta: PaginationMeta;
  readonly links: PaginationLinks;
}

export interface PaginationMeta {
  readonly currentPage: number;
  readonly lastPage: number;
  readonly perPage: number;
  readonly total: number;
}

export interface PaginationLinks {
  readonly first: string;
  readonly last: string;
  readonly prev: string | null;
  readonly next: string | null;
}
