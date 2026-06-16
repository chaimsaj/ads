import { Router } from 'express';

import { validateQuery } from '../../../infrastructure/http/validation.middleware';
import type { DashboardController } from '../controllers/dashboard.controller';
import { dashboardQuerySchema } from '../validators/dashboard.validator';

export function createDashboardRoutes(
  controller: DashboardController,
  adminAuthenticate: ReturnType<typeof import('../../identity/middleware/authenticate.middleware').createAdminAuthenticate>,
): Router {
  const router = Router();

  router.use(adminAuthenticate);

  router.get('/stats', controller.stats);
  router.get('/revenue', validateQuery(dashboardQuerySchema), controller.revenue);
  router.get('/campaigns', controller.campaigns);
  router.get('/users', validateQuery(dashboardQuerySchema), controller.users);

  return router;
}
