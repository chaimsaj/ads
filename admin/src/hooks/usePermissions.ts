import { useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { hasPermission, type Permission } from '../utils/permissions';

export function usePermissions() {
  const { user } = useAuth();

  return useMemo(
    () => ({
      can: (permission: Permission): boolean => {
        if (!user) return false;
        return hasPermission(user.permissions, user.role, permission);
      },
      canAny: (...permissions: Permission[]): boolean => {
        if (!user) return false;
        return permissions.some((p) => hasPermission(user.permissions, user.role, p));
      },
      canAll: (...permissions: Permission[]): boolean => {
        if (!user) return false;
        return permissions.every((p) => hasPermission(user.permissions, user.role, p));
      },
      role: user?.role || null,
    }),
    [user]
  );
}
