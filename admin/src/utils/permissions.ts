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

// Mirrors the backend authorization policies in the Ads service
// (AdsUserRoles / AdsAuthExtensions), so the UI hides exactly what the server would reject:
//   - GovernanceFamily (super_admin, admin): user write/delete, settings write.
//   - ManageFamily (super_admin, admin, moderator): campaign write/approve/delete.
//   - AdminFamily (all admin roles): read.
export const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  super_admin: Object.values(PERMISSIONS),
  admin: [
    PERMISSIONS.USERS_READ,
    PERMISSIONS.USERS_WRITE,
    PERMISSIONS.USERS_DELETE,
    PERMISSIONS.CAMPAIGNS_READ,
    PERMISSIONS.CAMPAIGNS_WRITE,
    PERMISSIONS.CAMPAIGNS_APPROVE,
    PERMISSIONS.CAMPAIGNS_DELETE,
    PERMISSIONS.SETTINGS_READ,
    PERMISSIONS.SETTINGS_WRITE,
  ],
  moderator: [
    PERMISSIONS.USERS_READ,
    PERMISSIONS.CAMPAIGNS_READ,
    PERMISSIONS.CAMPAIGNS_WRITE,
    PERMISSIONS.CAMPAIGNS_APPROVE,
    PERMISSIONS.CAMPAIGNS_DELETE,
  ],
  viewer: [
    PERMISSIONS.USERS_READ,
    PERMISSIONS.CAMPAIGNS_READ,
    PERMISSIONS.SETTINGS_READ,
  ],
};

// Permission checks are done via the AuthContext's `hasPermission(permission)`, which resolves
// the effective set from the current user's role (ROLE_PERMISSIONS above). No standalone helpers here.
