import { prisma } from '../../infrastructure/database/prisma.client';

import { AuthController } from './controllers/auth.controller';
import { AdminAuthController } from './controllers/admin-auth.controller';
import { UserRepository } from './repositories/user.repository';
import { AdminUserRepository } from './repositories/admin-user.repository';
import { RefreshTokenRepository } from './repositories/refresh-token.repository';
import { AuditLogRepository } from './repositories/audit-log.repository';
import { createAuthRoutes } from './routes/auth.routes';
import { createAdminAuthRoutes } from './routes/admin-auth.routes';
import { PasswordService } from './services/password.service';
import { TokenService } from './services/token.service';
import { TwoFactorService } from './services/two-factor.service';
import { AuthService } from './services/auth.service';
import { AdminAuthService } from './services/admin-auth.service';

export function buildIdentityDomain() {
  // Repositories
  const userRepo = new UserRepository(prisma);
  const adminUserRepo = new AdminUserRepository(prisma);
  const refreshTokenRepo = new RefreshTokenRepository(prisma);
  const auditLogRepo = new AuditLogRepository(prisma);

  // Services
  const passwordService = new PasswordService();
  const tokenService = new TokenService(refreshTokenRepo);
  const twoFactorService = new TwoFactorService();
  const authService = new AuthService(userRepo, tokenService, passwordService);
  const adminAuthService = new AdminAuthService(
    adminUserRepo,
    tokenService,
    passwordService,
    twoFactorService,
    auditLogRepo,
  );

  // Controllers
  const authController = new AuthController(authService);
  const adminAuthController = new AdminAuthController(adminAuthService);

  // Routes
  const authRoutes = createAuthRoutes(authController, tokenService);
  const adminAuthRoutes = createAdminAuthRoutes(adminAuthController, tokenService);

  return { authRoutes, adminAuthRoutes, tokenService, passwordService, auditLogRepo };
}

export { createAuthenticate, createAdminAuthenticate } from './middleware/authenticate.middleware';
export { authorize, requirePermission } from './middleware/authorize.middleware';
