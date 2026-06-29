import { useCallback, useEffect, useMemo } from 'react';
import { usersApi } from '../api/users';
import { useToast } from '../context/ToastContext';
import { isApiError } from '../api/client';
import { useDebounce } from './useDebounce';
import { usePagination } from './usePagination';
import { useQuery, invalidate } from '../lib/queryCache';
import type { User, PaginatedResponse } from '../types';

interface UseUsersFilters {
  status?: User['status'];
  role?: User['role'];
}

export function useUsers(filters: UseUsersFilters = {}) {
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
  const key = `users:list:${JSON.stringify(params)}`;

  const { data, isLoading, error, refetch } = useQuery<PaginatedResponse<User>>(key, () =>
    usersApi.getAll(params)
  );

  useEffect(() => {
    if (error) toast.error(error);
  }, [error, toast]);

  const updateUserStatus = useCallback(
    async (id: string, status: User['status']) => {
      try {
        await usersApi.updateStatus(id, status);
        toast.success('User status updated');
        invalidate('users:');
        await refetch();
      } catch (err) {
        toast.error(isApiError(err) ? err.message : 'Failed to update user status');
      }
    },
    [refetch, toast]
  );

  const deleteUser = useCallback(
    async (id: string) => {
      try {
        await usersApi.delete(id);
        toast.success('User deleted');
        invalidate('users:');
        invalidate('dashboard:');
        await refetch();
      } catch (err) {
        toast.error(isApiError(err) ? err.message : 'Failed to delete user');
      }
    },
    [refetch, toast]
  );

  const bulkAction = useCallback(
    async (action: 'activate' | 'suspend' | 'delete', ids: string[]) => {
      try {
        const result = await usersApi.bulkAction(action, ids);
        toast.success(
          `Bulk ${action} completed: ${result.success.length} succeeded, ${result.failed.length} failed`
        );
        invalidate('users:');
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
      users: data?.data ?? [],
      pagination: {
        ...pagination,
        total: data?.pagination.total ?? 0,
        totalPages: data?.pagination.totalPages ?? 0,
      },
      isLoading,
      error,
      refetch,
      updateUserStatus,
      deleteUser,
      bulkAction,
    }),
    [data, pagination, isLoading, error, refetch, updateUserStatus, deleteUser, bulkAction]
  );
}
