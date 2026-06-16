import { prisma } from '../../infrastructure/database/prisma.client';
import type { ITokenService } from '../identity/interfaces/token-service.interface';
import { createAdminAuthenticate } from '../identity/middleware/authenticate.middleware';

import { AuditLogController } from './controllers/audit-log.controller';
import { SettingsController } from './controllers/settings.controller';
import { AdminAuditLogRepository } from './repositories/admin-audit-log.repository';
import { SettingsRepository } from './repositories/settings.repository';
import { createAuditLogRoutes } from './routes/audit-log.routes';
import { createSettingsRoutes } from './routes/settings.routes';
import { AuditLogService } from './services/audit-log.service';
import { SettingsService } from './services/settings.service';

export function buildAdministrationDomain(tokenService: ITokenService) {
  // Repositories
  const auditLogRepo = new AdminAuditLogRepository(prisma);
  const settingsRepo = new SettingsRepository(prisma);

  // Services
  const auditLogService = new AuditLogService(auditLogRepo);
  const settingsService = new SettingsService(settingsRepo, auditLogRepo);

  // Controllers
  const auditLogController = new AuditLogController(auditLogService);
  const settingsController = new SettingsController(settingsService);

  // Middleware
  const adminAuthenticate = createAdminAuthenticate(tokenService);

  // Routes
  const auditLogRoutes = createAuditLogRoutes(auditLogController, adminAuthenticate);
  const settingsRoutes = createSettingsRoutes(settingsController, adminAuthenticate);

  return { auditLogRoutes, settingsRoutes };
}
