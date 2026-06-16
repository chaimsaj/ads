import { useState, useCallback, useMemo, useEffect } from 'react';
import { campaignsApi } from '../api/campaigns';
import { useToast } from '../context/ToastContext';
import { isApiError } from '../api/client';
import { useDebounce } from './useDebounce';
import { usePagination } from './usePagination';
import type { Campaign, PaginatedResponse } from '../types';

interface UseCampaignsFilters {
  status?: Campaign['status'];
  adFormat?: Campaign['adFormat'];
}

export function useCampaigns(filters: UseCampaignsFilters = {}) {
  const toast = useToast();
  const pagination = usePagination({ initialLimit: 10 });
  const debouncedSearch = useDebounce(pagination.search, 300);

  const [data, setData] = useState<PaginatedResponse<Campaign> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCampaigns = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await campaignsApi.getAll({
        page: pagination.page,
        limit: pagination.limit,
        search: debouncedSearch,
        sortBy: pagination.sortBy,
        sortOrder: pagination.sortOrder,
        ...filters,
      });
      setData(result);
    } catch (err) {
      const message = isApiError(err) ? err.message : 'Failed to fetch campaigns';
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, [pagination.page, pagination.limit, debouncedSearch, pagination.sortBy, pagination.sortOrder, filters, toast]);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  const approveCampaign = useCallback(
    async (id: string) => {
      try {
        await campaignsApi.approve(id);
        toast.success('Campaign approved');
        await fetchCampaigns();
      } catch (err) {
        const message = isApiError(err) ? err.message : 'Failed to approve campaign';
        toast.error(message);
      }
    },
    [fetchCampaigns, toast]
  );

  const rejectCampaign = useCallback(
    async (id: string, reason?: string) => {
      try {
        await campaignsApi.reject(id, reason);
        toast.success('Campaign rejected');
        await fetchCampaigns();
      } catch (err) {
        const message = isApiError(err) ? err.message : 'Failed to reject campaign';
        toast.error(message);
      }
    },
    [fetchCampaigns, toast]
  );

  const deleteCampaign = useCallback(
    async (id: string) => {
      try {
        await campaignsApi.delete(id);
        toast.success('Campaign deleted');
        await fetchCampaigns();
      } catch (err) {
        const message = isApiError(err) ? err.message : 'Failed to delete campaign';
        toast.error(message);
      }
    },
    [fetchCampaigns, toast]
  );

  const bulkAction = useCallback(
    async (action: 'activate' | 'pause' | 'delete', ids: string[]) => {
      try {
        const result = await campaignsApi.bulkAction(action, ids);
        toast.success(
          `Bulk ${action} completed: ${result.success.length} succeeded, ${result.failed.length} failed`
        );
        await fetchCampaigns();
        return result;
      } catch (err) {
        const message = isApiError(err) ? err.message : 'Bulk action failed';
        toast.error(message);
        throw err;
      }
    },
    [fetchCampaigns, toast]
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
      refetch: fetchCampaigns,
      approveCampaign,
      rejectCampaign,
      deleteCampaign,
      bulkAction,
    }),
    [data, pagination, isLoading, error, fetchCampaigns, approveCampaign, rejectCampaign, deleteCampaign, bulkAction]
  );
}
