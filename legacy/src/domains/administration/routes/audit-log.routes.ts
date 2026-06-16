import { Router } from 'express';

import { validateQuery, validateParams } from '../../../infrastructure/http/validation.middleware';
import type { AuditLogController } from '../controllers/audit-log.controller';
import { auditLogQuerySchema, auditLogIdParamSchema } from '../validators/administration.validator';

export function createAuditLogRoutes(
  controller: AuditLogController,
  adminAuthenticate: ReturnType<typeof import('../../identity/middleware/authenticate.middleware').createAdminAuthenticate>,
): Router {
  const router = Router();

  router.use(adminAuthenticate);

  router.get('/', validateQuery(auditLogQuerySchema), controller.list);
  router.get('/:id', validateParams(auditLogIdParamSchema), controller.show);

  return router;
}
