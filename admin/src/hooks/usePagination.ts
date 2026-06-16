import { useState, useCallback, useMemo } from 'react';
import type { SortDirection } from '../types';

interface PaginationState {
  page: number;
  limit: number;
  search: string;
  sortBy: string;
  sortOrder: SortDirection;
}

interface UsePaginationOptions {
  initialPage?: number;
  initialLimit?: number;
  initialSortBy?: string;
  initialSortOrder?: SortDirection;
}

export function usePagination(options: UsePaginationOptions = {}) {
  const [state, setState] = useState<PaginationState>({
    page: options.initialPage ?? 1,
    limit: options.initialLimit ?? 10,
    search: '',
    sortBy: options.initialSortBy ?? '',
    sortOrder: options.initialSortOrder ?? 'asc',
  });

  const setPage = useCallback((page: number) => {
    setState((prev) => ({ ...prev, page }));
  }, []);

  const setLimit = useCallback((limit: number) => {
    setState((prev) => ({ ...prev, limit, page: 1 }));
  }, []);

  const setSearch = useCallback((search: string) => {
    setState((prev) => ({ ...prev, search, page: 1 }));
  }, []);

  const setSort = useCallback((sortBy: string, sortOrder: SortDirection) => {
    setState((prev) => ({ ...prev, sortBy, sortOrder }));
  }, []);

  const toggleSort = useCallback((key: string) => {
    setState((prev) => {
      if (prev.sortBy === key) {
        return { ...prev, sortOrder: prev.sortOrder === 'asc' ? 'desc' : 'asc' };
      }
      return { ...prev, sortBy: key, sortOrder: 'asc' };
    });
  }, []);

  const reset = useCallback(() => {
    setState({
      page: options.initialPage ?? 1,
      limit: options.initialLimit ?? 10,
      search: '',
      sortBy: options.initialSortBy ?? '',
      sortOrder: options.initialSortOrder ?? 'asc',
    });
  }, [options.initialPage, options.initialLimit, options.initialSortBy, options.initialSortOrder]);

  return useMemo(
    () => ({
      ...state,
      setPage,
      setLimit,
      setSearch,
      setSort,
      toggleSort,
      reset,
    }),
    [state, setPage, setLimit, setSearch, setSort, toggleSort, reset]
  );
}
