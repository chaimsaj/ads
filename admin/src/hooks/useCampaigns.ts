import { useCallback, useEffect, useMemo } from 'react';
import { campaignsApi } from '../api/campaigns';
import { useToast } from '../context/ToastContext';
import { isApiError } from '../api/client';
import { useDebounce } from './useDebounce';
import { usePagination } from './usePagination';
import { useQuery, invalidate } from '../lib/queryCache';
import type { Campaign, PaginatedResponse } from '../types';

interface UseCampaignsFilters {
  status?: Campaign['status'];
  adFormat?: Campaign['adFormat'];
}

export function useCampaigns(filters: UseCampaignsFilters = {}) {
  const toast = useToast();
  const pagination = usePagination({ initialLimit: 10 });
  const debouncedSearch = useDebounce(pagination.search, 300);

  const params = {
    page: pagination.page,
    limit: pagination.limit,
    search: debouncedSearch,
    sortBy: pagination.sortBy,
    sortOrder: pagination.sortOrder,
    ...filters,
  };
  const key = `campaigns:list:${JSON.stringify(params)}`;

  const { data, isLoading, error, refetch } = useQuery<PaginatedResponse<Campaign>>(key, () =>
    campaignsApi.getAll(params)
  );

  useEffect(() => {
    if (error) toast.error(error);
  }, [error, toast]);

  // A campaign change can affect the dashboard's counts too, so drop both caches.
  const runMutation = useCallback(
    async <T>(action: () => Promise<T>, successMessage: string, failureMessage: string): Promise<T> => {
      try {
        const result = await action();
        toast.success(successMessage);
        invalidate('campaigns:');
        invalidate('dashboard:');
        await refetch();
        return result;
      } catch (err) {
        toast.error(isApiError(err) ? err.message : failureMessage);
        throw err;
      }
    },
    [refetch, toast]
  );

  const approveCampaign = useCallback(
    (id: string) => runMutation(() => campaignsApi.approve(id), 'Campaign approved', 'Failed to approve campaign'),
    [runMutation]
  );

  const rejectCampaign = useCallback(
    (id: string, reason?: string) =>
      runMutation(() => campaignsApi.reject(id, reason), 'Campaign rejected', 'Failed to reject campaign'),
    [runMutation]
  );

  const deleteCampaign = useCallback(
    (id: string) => runMutation(() => campaignsApi.delete(id), 'Campaign deleted', 'Failed to delete campaign'),
    [runMutation]
  );

  const bulkAction = useCallback(
    async (action: 'activate' | 'pause' | 'delete', ids: string[]) => {
      try {
        const result = await campaignsApi.bulkAction(action, ids);
        toast.success(
          `Bulk ${action} completed: ${result.success.length} succeeded, ${result.failed.length} failed`
        );
        invalidate('campaigns:');
        invalidate('dashboard:');
        await refetch();
        return result;
      } catch (err) {
        toast.error(isApiError(err) ? err.message : 'Bulk action failed');
        throw err;
      }
    },
    [refetch, toast]
  );

  return useMemo(
    () => ({
      campaigns: data?.data ?? [],
      pagination: {
        ...pagination,
        total: data?.pagination.total ?? 0,
        totalPages: data?.pagination.totalPages ?? 0,
      },
      isLoading,
      error,
      refetch,
      approveCampaign,
      rejectCampaign,
      deleteCampaign,
      bulkAction,
    }),
    [data, pagination, isLoading, error, refetch, approveCampaign, rejectCampaign, deleteCampaign, bulkAction]
  );
}
