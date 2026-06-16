export const PERMISSIONS = {
  USERS_READ: 'users:read',
  USERS_WRITE: 'users:write',
  USERS_DELETE: 'users:delete',
  CAMPAIGNS_READ: 'campaigns:read',
  CAMPAIGNS_WRITE: 'campaigns:write',
  CAMPAIGNS_DELETE: 'campaigns:delete',
  CAMPAIGNS_APPROVE: 'campaigns:approve',
  SETTINGS_READ: 'settings:read',
  SETTINGS_WRITE: 'settings:write',
} as const;

export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS];

export const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  super_admin: Object.values(PERMISSIONS),
  admin: [
    PERMISSIONS.USERS_READ,
    PERMISSIONS.USERS_WRITE,
    PERMISSIONS.CAMPAIGNS_READ,
    PERMISSIONS.CAMPAIGNS_WRITE,
    PERMISSIONS.CAMPAIGNS_APPROVE,
    PERMISSIONS.SETTINGS_READ,
  ],
  moderator: [
    PERMISSIONS.USERS_READ,
    PERMISSIONS.CAMPAIGNS_READ,
    PERMISSIONS.CAMPAIGNS_WRITE,
    PERMISSIONS.CAMPAIGNS_APPROVE,
  ],
  viewer: [
    PERMISSIONS.USERS_READ,
    PERMISSIONS.CAMPAIGNS_READ,
    PERMISSIONS.SETTINGS_READ,
  ],
};

export function hasPermission(
  userPermissions: string[],
  userRole: string,
  permission: Permission
): boolean {
  if (userRole === 'super_admin') return true;
  return userPermissions.includes(permission);
}

export function canAccessSettings(
  userPermissions: string[],
  userRole: string
): boolean {
  return hasPermission(userPermissions, userRole, PERMISSIONS.SETTINGS_READ);
}

export function canManageUsers(
  userPermissions: string[],
  userRole: string
): boolean {
  return hasPermission(userPermissions, userRole, PERMISSIONS.USERS_WRITE);
}

export function canApproveCampaigns(
  userPermissions: string[],
  userRole: string
): boolean {
  return hasPermission(userPermissions, userRole, PERMISSIONS.CAMPAIGNS_APPROVE);
}
