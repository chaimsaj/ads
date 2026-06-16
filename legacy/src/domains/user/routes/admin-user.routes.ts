import { Router } from 'express';
import type { RequestHandler } from 'express';

import { validate, validateQuery, validateParams } from '../../../infrastructure/http/validation.middleware';
import type { AdminUserController } from '../controllers/admin-user.controller';
import {
  adminUserIdParamSchema,
  adminUserQuerySchema,
  adminUpdateUserSchema,
  adminUpdateUserStatusSchema,
  bulkUserActionSchema,
} from '../validators/admin-user.validator';

export function createAdminUserRoutes(
  controller: AdminUserController,
  adminAuthenticate: RequestHandler,
): Router {
  const router = Router();

  router.use(adminAuthenticate);

  // Static routes first
  router.get('/status-counts', controller.statusCounts);

  // Bulk actions
  router.post('/bulk', validate(bulkUserActionSchema), controller.bulkAction);

  // List
  router.get('/', validateQuery(adminUserQuerySchema), controller.list);

  // Parameterized routes
  router.get('/:id', validateParams(adminUserIdParamSchema), controller.show);
  router.put(
    '/:id',
    validateParams(adminUserIdParamSchema),
    validate(adminUpdateUserSchema),
    controller.update,
  );
  router.patch(
    '/:id/status',
    validateParams(adminUserIdParamSchema),
    validate(adminUpdateUserStatusSchema),
    controller.updateStatus,
  );
  router.post('/:id/suspend', validateParams(adminUserIdParamSchema), controller.suspend);
  router.post('/:id/activate', validateParams(adminUserIdParamSchema), controller.activate);
  router.delete('/:id', validateParams(adminUserIdParamSchema), controller.destroy);

  return router;
}
