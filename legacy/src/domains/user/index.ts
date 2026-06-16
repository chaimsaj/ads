import { prisma } from '../../infrastructure/database/prisma.client';
import type { ITokenService } from '../identity/interfaces/token-service.interface';
import type { IPasswordService } from '../identity/interfaces/password-service.interface';
import type { IAuditLogRepository } from '../identity/interfaces/audit-log-repository.interface';
import { createAuthenticate, createAdminAuthenticate } from '../identity/middleware/authenticate.middleware';

import { AdminUserController } from './controllers/admin-user.controller';
import { UserController } from './controllers/user.controller';
import { AdminUserManagementRepository } from './repositories/admin-user-management.repository';
import { NotificationSettingRepository } from './repositories/notification-setting.repository';
import { UserProfileRepository } from './repositories/user-profile.repository';
import { createAdminUserRoutes } from './routes/admin-user.routes';
import { createUserRoutes } from './routes/user.routes';
import { AdminUserManagementService } from './services/admin-user-management.service';
import { UserProfileService } from './services/user-profile.service';

export function buildUserDomain(
  tokenService: ITokenService,
  passwordService: IPasswordService,
  auditLogRepo: IAuditLogRepository,
) {
  // Repositories
  const userProfileRepo = new UserProfileRepository(prisma);
  const notificationRepo = new NotificationSettingRepository(prisma);
  const adminUserMgmtRepo = new AdminUserManagementRepository(prisma);

  // Services
  const profileService = new UserProfileService(userProfileRepo, notificationRepo, passwordService);
  const adminUserService = new AdminUserManagementService(adminUserMgmtRepo, auditLogRepo);

  // Controllers
  const userController = new UserController(profileService);
  const adminUserController = new AdminUserController(adminUserService);

  // Middleware
  const authenticate = createAuthenticate(tokenService);
  const adminAuthenticate = createAdminAuthenticate(tokenService);

  // Routes
  const userRoutes = createUserRoutes(userController, authenticate);
  const adminUserRoutes = createAdminUserRoutes(adminUserController, adminAuthenticate);

  return { userRoutes, adminUserRoutes };
}
