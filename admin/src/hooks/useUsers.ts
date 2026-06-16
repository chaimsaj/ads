import { useState, useCallback, useMemo, useEffect } from 'react';
import { usersApi } from '../api/users';
import { useToast } from '../context/ToastContext';
import { isApiError } from '../api/client';
import { useDebounce } from './useDebounce';
import { usePagination } from './usePagination';
import type { User, PaginatedResponse } from '../types';

interface UseUsersFilters {
  status?: User['status'];
  role?: User['role'];
}

export function useUsers(filters: UseUsersFilters = {}) {
  const toast = useToast();
  const pagination = usePagination({ initialLimit: 10 });
  const debouncedSearch = useDebounce(pagination.search, 300);

  const [data, setData] = useState<PaginatedResponse<User> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await usersApi.getAll({
        page: pagination.page,
        limit: pagination.limit,
        search: debouncedSearch,
        sortBy: pagination.sortBy,
        sortOrder: pagination.sortOrder,
        ...filters,
      });
      setData(result);
    } catch (err) {
      const message = isApiError(err) ? err.message : 'Failed to fetch users';
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, [pagination.page, pagination.limit, debouncedSearch, pagination.sortBy, pagination.sortOrder, filters, toast]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const updateUserStatus = useCallback(
    async (id: string, status: User['status']) => {
      try {
        await usersApi.updateStatus(id, status);
        toast.success('User status updated');
        await fetchUsers();
      } catch (err) {
        const message = isApiError(err) ? err.message : 'Failed to update user status';
        toast.error(message);
      }
    },
    [fetchUsers, toast]
  );

  const deleteUser = useCallback(
    async (id: string) => {
      try {
        await usersApi.delete(id);
        toast.success('User deleted');
        await fetchUsers();
      } catch (err) {
        const message = isApiError(err) ? err.message : 'Failed to delete user';
        toast.error(message);
      }
    },
    [fetchUsers, toast]
  );

  const bulkAction = useCallback(
    async (action: 'activate' | 'suspend' | 'delete', ids: string[]) => {
      try {
        const result = await usersApi.bulkAction(action, ids);
        toast.success(
          `Bulk ${action} completed: ${result.success.length} succeeded, ${result.failed.length} failed`
        );
        await fetchUsers();
        return result;
      } catch (err) {
        const message = isApiError(err) ? err.message : 'Bulk action failed';
        toast.error(message);
        throw err;
      }
    },
    [fetchUsers, toast]
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
      refetch: fetchUsers,
      updateUserStatus,
      deleteUser,
      bulkAction,
    }),
    [data, pagination, isLoading, error, fetchUsers, updateUserStatus, deleteUser, bulkAction]
  );
}
